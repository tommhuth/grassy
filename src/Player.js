import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import { reduceBladesHealth, reduceEngineHealth, setInDanger, setPlayerPosition, setPlayerRotation, setSpeed, useStore } from "./data/store"
import { useKeys } from "./hooks"


export default function Player({ width = 4, depth = 5 }) {
    let obstacles = useStore(i => i.obstacles)
    let [playerWidth, playerDepth] = useStore(i => i.player.size)
    let bladesActive = useStore(i => i.player.bladesActive)
    let dangers = useStore(i => i.dangers)
    let ref = useRef(0)
    let speed = useRef(0)
    let speedAcceleration = useRef(0)
    let [crashed, setCrashed] = useState(false)
    let rotation = useRef(0)
    let keys = useKeys()
    let rotationAcceleration = useRef(0)
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
        let isMoving = Math.abs(speed.current) > .01
        let turnStrength = .0075
        let accelerationStrength = .0075
        let maxTurnAcceleration = .152
        let maxSpeedAcceleration = .25

        if (keys.w && !crashed) {
            speedAcceleration.current += accelerationStrength
        }

        if (keys.s && !crashed) {
            speedAcceleration.current -= accelerationStrength * .45
        }

        if (keys.a && isMoving) {
            rotationAcceleration.current += turnStrength
        }

        if (keys.d && isMoving) {
            rotationAcceleration.current -= turnStrength
        }

        if (Math.abs(speed.current) < .0175) {
            rotationAcceleration.current *= .2
        }

        rotationAcceleration.current *= .75
        rotation.current += Math.min(Math.abs(rotationAcceleration.current), maxTurnAcceleration) * Math.sign(rotationAcceleration.current)
        speed.current += Math.min(Math.abs(speedAcceleration.current), maxSpeedAcceleration) * Math.sign(speedAcceleration.current)

        speedAcceleration.current *= .8
        speed.current *= .75
    })

    useFrame(() => {
        ref.current.position.y = .75
        ref.current.position.x += Math.cos(rotation.current + Math.PI / 2) * speed.current
        ref.current.position.z -= Math.sin(rotation.current + Math.PI / 2) * speed.current

        ref.current.rotation.y = rotation.current

        setPlayerPosition([ref.current.position.x, ref.current.position.y, ref.current.position.z])
        setPlayerRotation(ref.current.rotation.y)

        setSpeed(speed.current * 60)
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
                    let push = .1
                    let direction = hitDelta.copy(ref.current.position)
                        .sub(obstacle.obb.center )
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
                    speed.current *= -1.35
                    speedAcceleration.current = 0
                    rotationAcceleration.current = 0
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