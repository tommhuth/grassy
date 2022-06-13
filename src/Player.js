import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Vector3, MeshPhongMaterial } from "three"
import { reduceBladesHealth, crash, setBladesActive, setInDanger, setPlayerPosition, useStore, setTrauma } from "./data/store"
import { Shadow, useGLTF } from "@react-three/drei"
import random from "@huth/random"
import { darkerGray, white } from "./global"

useGLTF.preload("/models/craft.glb")

const materials = {
    metalDark: darkerGray,
    metal: white,
    dark: new MeshPhongMaterial({ color: "#111" })
}

export default function Player() {
    let { nodes } = useGLTF("/models/craft.glb")
    let obstacles = useStore(i => i.obstacles)
    let bladesActive = useStore(i => i.player.bladesActive)
    let [, height] = useStore(i => i.player.size)
    let dangers = useStore(i => i.dangers)
    let engineHealth = useStore(i => i.player.engineHealth)
    let vehicle = useStore(i => i.vehicle)
    let obb = useStore(i => i.player.obb)
    let outerRef = useRef()
    let speed = useRef(0)
    let rotation = useRef(0)
    let tick = useRef(0)
    let playerRef = useRef(0)
    let shadowRef = useRef(0)
    let bladesPenalty = useRef(1)
    let aabb = useStore(i => i.player.aabb)
    let playerRadius = useStore(i => i.player.radius)
    let inDanger = useStore(i => i.player.inDanger)
    let dangerPosition = useMemo(() => new Vector3(), [])
    let playerPosition = useMemo(() => new Vector3(), [])
    let hitDelta = useMemo(() => new Vector3(), [])

    useEffect(() => {
        return useStore.subscribe(s => speed.current = s, state => state.input.speed)
    }, [])

    useEffect(() => {
        return useStore.subscribe(r => rotation.current = r, state => state.input.rotation)
    }, [])

    useEffect(() => {
        if (engineHealth === 0) {
            setBladesActive(false)
        }
    }, [engineHealth])

    useFrame(({ clock }) => {
        if (!outerRef.current) {
            return
        }

        bladesPenalty.current += ((bladesActive ? vehicle.bladesPenalty : 1) - bladesPenalty.current) * .05

        outerRef.current.position.x += Math.cos(rotation.current) * speed.current * bladesPenalty.current
        outerRef.current.position.z -= Math.sin(rotation.current) * speed.current * bladesPenalty.current
        outerRef.current.rotation.y = rotation.current + Math.PI / 2

        if(engineHealth > 0) {
            playerRef.current.position.y = height / 2 + Math.cos(clock.getElapsedTime() * 2) * .15
        } else {
            playerRef.current.position.y += (-.5 - playerRef.current.position.y) * .05
        }
    })

    useFrame(() => {
        if (!shadowRef.current) {
            return
        }

        if (bladesActive) {
            let size = random.float(6, 11)
            let scale = Math.max(speed.current / (speed.current > 0 ? vehicle.maxSpeed : vehicle.minSpeed), .35)

            shadowRef.current.scale.set(size, size, size)
            shadowRef.current.material.opacity = random.float(.5, 1) * scale
        } else {
            let size = random.float(6, 7)
            let scale = Math.max(speed.current / (speed.current > 0 ? vehicle.maxSpeed : vehicle.minSpeed), .25)

            shadowRef.current.scale.set(size, size, size)
            shadowRef.current.material.opacity = random.float(.4, .65) * scale
        }
    })

    useFrame(() => {
        if (outerRef.current) {
            setPlayerPosition([outerRef.current.position.x, outerRef.current.position.y, outerRef.current.position.z])
        }
    })

    useEffect(() => {
        if (inDanger && bladesActive) {
            let action = () => {
                reduceBladesHealth()
                setTrauma(random.float(.75, 1), .1)
            }
            let id = setInterval(action, 200)
            let onVisibilityChange = () => {
                if (document.hidden) {
                    clearInterval(id)
                } else {
                    setInterval(action, 200)
                }
            }

            document.addEventListener("visibilitychange", onVisibilityChange)
            reduceBladesHealth()

            return () => {
                clearInterval(id)
                document.removeEventListener("visibilitychange", onVisibilityChange)
            }
        }
    }, [inDanger, bladesActive])

    useFrame(() => {
        tick.current++

        if (!outerRef.current || tick.current % 2 !== 0) {
            return
        }

        aabb.setFromObject(outerRef.current)
        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.applyMatrix4(outerRef.current.matrixWorld)

        for (let obstacle of obstacles) {
            if (aabb.intersectsBox(obstacle.aabb)) {
                let hasCrashed = false
                let hitSpeed = speed.current

                while (obstacle.obb.intersectsOBB(obb)) {
                    let push = .025
                    let direction = hitDelta.copy(outerRef.current.position)
                        .sub(obstacle.obb.center)
                        .normalize()
                        .multiplyScalar(push)

                    outerRef.current.position.x += direction.x
                    outerRef.current.position.z += direction.z

                    obb.center.set(0, 0, 0)
                    obb.rotation.identity()
                    outerRef.current.updateMatrixWorld()
                    obb.applyMatrix4(outerRef.current.matrixWorld)

                    hasCrashed = true

                    break
                }

                if (hasCrashed) {
                    let maxDamage = 25
                    let damage = Math.ceil(Math.abs(hitSpeed / (hitSpeed > 0 ? vehicle.maxSpeed : vehicle.minSpeed)) * maxDamage)

                    crash(damage)
                    setTrauma(1, .15)

                    break
                }
            }
        }
    })

    useFrame(() => {
        if (!outerRef.current) {
            return
        }

        let result = false

        for (let danger of dangers) {
            if (aabb.intersectsBox(danger.aabb)) {
                let distance = danger.aabb.getCenter(dangerPosition).distanceTo(aabb.getCenter(playerPosition))

                if (distance < playerRadius + danger.radius) {
                    result = true
                    break
                }
            }

        }

        if (result && !inDanger) {
            setInDanger(true)
        } else if (!result && inDanger) {
            setInDanger(false)
        }
    })

    return (
        <group ref={outerRef}>
            <group
                rotation-y={Math.PI}
                position={[0, 0, 0]}
                scale={[2, 2, 2]}
                dispose={null}
                ref={playerRef}
            >
                <mesh
                    geometry={nodes.Mesh_craft_cargoB.geometry}
                    material={materials.metalDark}
                    castShadow
                    receiveShadow
                />
                <mesh
                    geometry={nodes.Mesh_craft_cargoB_1.geometry}
                    material={materials.metal}
                    castShadow
                    receiveShadow
                />
                <mesh
                    geometry={nodes.Mesh_craft_cargoB_2.geometry}
                    material={materials.dark}
                    castShadow
                    receiveShadow
                />
                <mesh
                    geometry={nodes.Mesh_craft_cargoB_3.geometry}
                    material={materials.metal}
                    castShadow
                    receiveShadow
                />
            </group>

            <Shadow
                color={"#00fff7"}
                ref={shadowRef}
                position={[0, .001, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[6, 6, 6]}
            />
        </group>
    )
}