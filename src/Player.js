import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Vector3, MeshPhongMaterial } from "three"
import { reduceBladesHealth, crash, setBladesActive, setInDanger, useStore, setTrauma, setPlayerMesh } from "./data/store"
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
    let mesh = useStore(i => i.player.mesh)
    let { nodes } = useGLTF("/models/craft.glb")
    let obstacles = useStore(i => i.obstacles)
    let bladesActive = useStore(i => i.player.bladesActive)
    let [, height] = useStore(i => i.player.size)
    let dangers = useStore(i => i.dangers)
    let engineHealth = useStore(i => i.player.engineHealth)
    let vehicle = useStore(i => i.vehicle)
    let obb = useStore(i => i.player.obb) 
    let aabb = useStore(i => i.player.aabb)
    let speed = useRef(0)
    let rotation = useRef(0)
    let tick = useRef(0) 
    let shadowRef = useRef(0)
    let bladesPenalty = useRef(1)
    let playerRadius = useStore(i => i.player.radius)
    let inDanger = useStore(i => i.player.inDanger)
    let dangerPosition = useMemo(() => new Vector3(), []) 
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
        if (!mesh) {
            return
        }

        bladesPenalty.current += ((bladesActive ? vehicle.bladesPenalty : 1) - bladesPenalty.current) * .05

        mesh.position.x += Math.cos(rotation.current) * speed.current * bladesPenalty.current
        mesh.position.z -= Math.sin(rotation.current) * speed.current * bladesPenalty.current
        mesh.rotation.y = rotation.current + Math.PI / 2

        if (engineHealth > 0) {
            mesh.position.y = height / 2 + Math.cos(clock.getElapsedTime() * 2) * .15
        } else {
            mesh.position.y += (-.5 - mesh.position.y) * .05
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

        if (!mesh || tick.current % 2 !== 0) {
            return
        }

        aabb.setFromObject(mesh)
        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.applyMatrix4(mesh.matrixWorld)

        for (let obstacle of obstacles) {
            if (aabb.intersectsBox(obstacle.aabb)) {
                let hasCrashed = false
                let hitSpeed = speed.current 

                while (obstacle.obb.intersectsOBB(obb)) {
                    let push = .025
                    let direction = hitDelta.copy(mesh.position)
                        .sub(obstacle.obb.center)
                        .normalize()
                        .multiplyScalar(push)

                    mesh.position.x += direction.x
                    mesh.position.z += direction.z

                    obb.center.set(0, 0, 0)
                    obb.rotation.identity()
                    mesh.updateMatrixWorld()
                    obb.applyMatrix4(mesh.matrixWorld)

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
        let mesh = useStore.getState().player.mesh

        if (!mesh) {
            return
        }

        let result = false 

        for (let danger of dangers) {
            if (aabb.intersectsBox(danger.aabb)) {
                let distance = danger.aabb.getCenter(dangerPosition).distanceTo(aabb.getCenter(mesh.position))

                console.log(distance)

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
        <group 
            ref={ref => ref && setPlayerMesh(ref)}
        >
            <group
                rotation-y={Math.PI}
                position={[0, 0, 0]}
                scale={[2, 2, 2]}
                dispose={null} 
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