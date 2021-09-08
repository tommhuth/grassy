import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { Vector2, Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import { reduceBladesHealth, reduceEngineHealth, setInDanger, setPlayerPosition, setPlayerRotation, setSpeed, useStore } from "./data/store"
import { useKeys } from "./hooks"


export default function Player({ width = 4, depth = 5 }) {
    let obstacles = useStore(i => i.obstacles)
    let [playerWidth, playerDepth] = useStore(i => i.player.size)
    let bladesActive = useStore(i => i.player.bladesActive)
    let dangers = useStore(i => i.dangers)
    let vehicle = useStore(i => i.vehicle)
    let ref = useRef(0)
    let speed = useRef(0)
    let [crashed, setCrashed] = useState(false)
    let rotation = useRef(Math.PI / 2)
    let keys = useKeys()
    let size = useMemo(() => {
        return new Vector3(playerWidth / 2, 1.5 / 2, playerDepth / 2)
    }, [playerWidth, playerDepth])
    let obb = useMemo(() => {
        return new OBB(new Vector3(0, 0, 0), size)
    }, [size])
    let aabb = useStore(i => i.player.aabb)
    let playerRadius = useStore(i => i.player.radius)
    let inDanger = useStore(i => i.player.inDanger)
    let playerPosition = useMemo(() => new Vector3(), [])
    let dangerPosition = useMemo(() => new Vector3(), [])
    let hitDelta = useMemo(() => new Vector3(), [])
    let velocity = useMemo(() => new Vector2(), [])
    let acceleration = useMemo(() => new Vector2(), [])

    useEffect(() => {
        if (crashed) {
            setTimeout(() => setCrashed(false), 250)
        }
    }, [crashed])

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
        let speedScale = Math.abs(speed.current / (speed.current > 0 ? vehicle.maxSpeed : vehicle.minSpeed))

        if (keys.w) {
            speed.current = Math.min(speed.current + vehicle.power, vehicle.maxSpeed * (bladesActive ? vehicle.bladesPenalty : 1))
        } else if (keys.s) {
            speed.current = Math.max(speed.current - vehicle.power, vehicle.minSpeed)
        } else {
            speed.current *= vehicle.lightness
        }

        if (keys.a) {
            rotation.current += vehicle.turnStrength * speedScale
        } else if (keys.d) {
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
        ref.current.position.y = .75

        ref.current.rotation.y = rotation.current + Math.PI / 2

        setPlayerPosition([ref.current.position.x, ref.current.position.y, ref.current.position.z])
        setPlayerRotation(ref.current.rotation.y)
        setSpeed(Math.sqrt(velocity.x ** 2 + velocity.y ** 2))
    })

    useFrame(() => {
        aabb.setFromObject(ref.current)
        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.applyMatrix4(ref.current.matrixWorld)

        for (let obstacle of obstacles) {
            if (aabb.intersectsBox(obstacle.aabb)) {
                let crash = false

                while (obstacle.obb.intersectsOBB(obb)) {
                    let push = .051
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
                }

                if (crash) {
                    speed.current *= -.25
                    velocity.x = 0
                    velocity.y = 0
                    acceleration.x = 0
                    acceleration.y = 0

                    setCrashed(true)
                    reduceEngineHealth(Math.ceil(Math.abs(speed.current) * 100 * .75))
                }
            }
        }
    })

    useFrame(() => {
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

    return (
        <mesh ref={ref}  >
            <boxBufferGeometry args={[width, 1.5, depth]} />
            <meshLambertMaterial color="darkgray" />
        </mesh>
    )
}