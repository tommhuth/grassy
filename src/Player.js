import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Vector2, Vector3, Quaternion, Color, Matrix4, MeshPhongMaterial } from "three"
import { reduceBladesHealth, reduceEngineHealth, setCrash, setInDanger, setPlayerPosition, setSpeed, useStore } from "./data/store"
import { useKeys, useModel } from "./hooks"
import random from "@huth/random"

const mats = {
    metalDark: new MeshPhongMaterial({ color: "#dd9" }),
    metalRed: new MeshPhongMaterial({ color: "#fff" }),
    metal: new MeshPhongMaterial({ color: "orange" }),
    dark: new MeshPhongMaterial({ color: "#445" })
}

export default function Player() {
    let obstacles = useStore(i => i.obstacles)
    let bladesActive = useStore(i => i.player.bladesActive)
    let [, height] = useStore(i => i.player.size)
    let dangers = useStore(i => i.dangers)
    let vehicle = useStore(i => i.vehicle)
    let engineHealth = useStore(i => i.player.engineHealth)
    let obb = useStore(i => i.player.obb)
    let healthy = engineHealth > 0
    let ref = useRef()
    let speed = useRef(0)
    let rotation = useRef(0)
    let tick = useRef(0)
    let [crashed, setCrashed] = useState(false)
    //let keys = useKeys()
    let aabb = useStore(i => i.player.aabb)
    let playerRadius = useStore(i => i.player.radius)
    let inDanger = useStore(i => i.player.inDanger)
    let playerPosition = useMemo(() => new Vector3(), [])
    let dangerPosition = useMemo(() => new Vector3(), [])
    let hitDelta = useMemo(() => new Vector3(), [])
    //let velocity = useMemo(() => new Vector2(), [])
    //let acceleration = useMemo(() => new Vector2(), [])
    let model = useModel({
        name: "craft_cargoB",
        onLoad(el) {
            el.traverse(i => {
                if (i.isMesh) {
                    i.castShadow = true
                    i.receiveShadow = true

                    i.material = mats[i.material.name]
                }
            })
        },
    })

    useEffect(() => {
        return useStore.subscribe(s => speed.current = s, state => state.input.speed)
    }, [])

    useEffect(() => {
        return useStore.subscribe(r => rotation.current = r, state => state.input.rotation)
    }, [])


    useFrame(() => {
        if (!ref.current) {
            return
        }
        /*

        let speedScale = Math.abs(speed.current / (speed.current > 0 ? vehicle.maxSpeed : vehicle.minSpeed))

        if (keys.w && healthy) {
            speed.current = Math.min(speed.current + vehicle.power, vehicle.maxSpeed * (bladesActive ? vehicle.bladesPenalty : 1))
        } else if (keys.s && healthy) {
            speed.current = Math.max(speed.current - vehicle.power, vehicle.minSpeed)
        } else {
            speed.current *= vehicle.lightness
        }

        if (keys.a && healthy) {
            rotation.current += vehicle.turnStrength * speedScale
        } else if (keys.d && healthy) {
            rotation.current -= vehicle.turnStrength * speedScale
        }

        acceleration.x = Math.cos(rotation.current) * speed.current
        acceleration.y = Math.sin(rotation.current) * speed.current

        velocity.x += acceleration.x
        velocity.y += acceleration.y

        velocity.x *= vehicle.friction
        velocity.y *= vehicle.friction

        ref.current.position.x += velocity.x
        ref.current.position.z -= velocity.y
        ref.current.position.y = height / 2


*/
        ref.current.position.x += Math.cos(rotation.current) * speed.current
        ref.current.position.z -= Math.sin(rotation.current) * speed.current
        ref.current.position.y = height / 2
        ref.current.rotation.y = rotation.current + Math.PI / 2

    })

    useFrame(() => {
        if (!ref.current) {
            return
        }
        setPlayerPosition([ref.current.position.x, ref.current.position.y, ref.current.position.z])
        //setPlayerRotation(ref.current.rotation.y)
        //setSpeed(speed.current)
    })


    useEffect(() => {
        if (inDanger && bladesActive) {
            let action = () => reduceBladesHealth()
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

        if (!ref.current || tick.current % 2 !== 0) {
            return
        }

        aabb.setFromObject(ref.current)
        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.applyMatrix4(ref.current.matrixWorld)

        outer:
        for (let obstacle of obstacles) {
            if (aabb.intersectsBox(obstacle.aabb)) {
                let crash = false

                while (obstacle.obb.intersectsOBB(obb)) {
                    let push = .025
                    let direction = hitDelta.copy(ref.current.position)
                        .sub(obstacle.obb.center)
                        .normalize()
                        .multiplyScalar(push)

                    ref.current.position.x += direction.x
                    ref.current.position.z += direction.z

                    obb.center.set(0, 0, 0)
                    obb.rotation.identity()
                    ref.current.updateMatrixWorld()
                    obb.applyMatrix4(ref.current.matrixWorld)

                    crash = true

                    break
                }

                if (crash) {
                    setCrash()
                    setCrashed(true)
                    break outer
                }
            }
        }
    })

    useFrame(() => {
        if (!ref.current) {
            return
        }
        let result = false

        for (let danger of dangers) {
            if (danger.aabb.intersectsBox(aabb)) {
                let distance = aabb.getCenter(dangerPosition).distanceTo(aabb.getCenter(playerPosition))

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

    if (!model) {
        return null
    }

    return (
        <group ref={ref}>
            <primitive object={model} rotation-y={Math.PI} position={[0, 0, 0]} scale={[2, 2, 2]} />
        </group>
    )
}