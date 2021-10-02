import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Vector2, Vector3, Quaternion, Color, Matrix4 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import { reduceBladesHealth, reduceEngineHealth, setInDanger, setPlayerPosition, setPlayerRotation, setSpeed, useStore } from "./data/store"
import { useKeys } from "./hooks"
import random from "@huth/random"

export default function Player({ width = 4, depth = 5, height = 3 }) {
    let obstacles = useStore(i => i.obstacles)
    let [playerWidth, playerDepth] = useStore(i => i.player.size)
    let bladesActive = useStore(i => i.player.bladesActive)
    let dangers = useStore(i => i.dangers)
    let vehicle = useStore(i => i.vehicle)
    let engineHealth = useStore(i => i.player.engineHealth)
    let healthy = engineHealth > 0
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
        ref.current.position.y = height/2

        ref.current.rotation.y = rotation.current + Math.PI / 2

        setPlayerPosition([ref.current.position.x, ref.current.position.y, ref.current.position.z])
        setPlayerRotation(ref.current.rotation.y)
        setSpeed(speed.current)
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
                }

                if (crash) {
                    let damage = Math.ceil(Math.abs(speed.current / (speed.current > 0 ? vehicle.maxSpeed : vehicle.minSpeed)) * 58) - 10

                    speed.current *= -.25
                    velocity.set(0, 0)
                    acceleration.set(0, 0)

                    setCrashed(true)
                    reduceEngineHealth(Math.max(damage, 0))
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
        <>
            <Sparks />
            <mesh ref={ref} castShadow receiveShadow>
                <boxBufferGeometry args={[width, height, depth]} />
                <meshLambertMaterial color="darkgray" />
            </mesh>
        </>
    )
}



let _matrix = new Matrix4()
let _rotation = new Quaternion()
let _position = new Vector3(0, 0, 0)
let _scale = new Vector3(1, 1, 1)
let _y = new Vector3(0, 1, 0)
let _color = new Color()
let index = 0

function Sparks({ count = 100 }) {
    let [instance, setInstance] = useState()
    let [sparks, setSparks] = useState([])
    let inDanger = useStore(i => i.player.inDanger)
    let bladesActive = useStore(i => i.player.bladesActive)
    let setElement = useCallback(({ index, position, rotation, scale }) => {
        if (instance) {
            instance.setMatrixAt(index, _matrix.compose(
                _position.set(...position),
                _rotation.setFromAxisAngle(_y, rotation ),
                _scale.set(...scale)
            ))
            instance.instanceMatrix.needsUpdate = true
        }
    }, [instance])
    let setColor = useCallback((index, color) => {
        instance.setColorAt(index, _color.set(color))
        instance.instanceColor.needsUpdate = true
        instance.material.needsUpdate = true
    }, [instance])
    let add = useCallback(() => {
        index++

        setSparks(i => [
            ...i,
            {
                x: playerPosition.current[0],
                y: 0, //playerPosition.current[1] + random.float(-.5, .25),
                z: playerPosition.current[2],
                size: random.float(inDanger ? .1 : .05, inDanger ? .2 :.1),
                index: index % count,
                color: inDanger ? random.pick("rgb(0,255,0)", "yellow", "rgb(0,255,0)", "white") : random.pick("rgb(0,255,0)" ),
                friction: random.float(.85, .9),
                rotation: random.float(0, Math.PI * 2),
                speed: random.float(.55, .75),
                id: random.id()
            }
        ])
    }, [count, inDanger])
    let remove = useCallback((id) => {
        setSparks(i => i.filter(i => i.id !== id))
    }, [])
    let playerPosition = useRef([0, 0, 0])

    useEffect(() => {
        return useStore.subscribe(
            i => playerPosition.current = i,
            state => state.player.position
        )
    }, [])

    useEffect(() => {
        if (bladesActive) {
            let id = setInterval(add, 100)

            return () => {
                clearInterval(id)
            }
        }
    }, [bladesActive, add])

    return (
        <>
            <instancedMesh position={[0, 0, 0]} ref={setInstance} args={[undefined, undefined, count]}>
                <boxBufferGeometry args={[1, 1, 1]} attach="geometry" />
                <meshBasicMaterial color="blue" attach="materal" />
            </instancedMesh>
            {sparks.map(i => <Spark {...i} setColor={setColor} remove={remove} setElement={setElement} key={i.id} />)}
        </>
    )
}

function Spark({
    index,
    id,
    color,
    setColor,
    x,
    y,
    z,
    remove,
    friction,
    speed: startSpeed,
    setElement,
    size,
    rotation
}) {
    let position = useMemo(() => new Vector3(x, y, z), [x, y, z])
    let gravity = useRef(.1)
    let speed = useRef(startSpeed)

    useEffect(() => {
        setColor(index, color)
    }, [setColor, index, color])

    useEffect(() => {
        return () => {
            setElement({
                index,
                position: [0, -10, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1]
            })
        }
    }, [setElement, index])

    useFrame(() => {
        position.x += Math.cos(rotation) * speed.current
        position.z -= Math.sin(rotation) * speed.current
        position.y += gravity.current

        if (position.y < .1) {
            position.y = .1
            gravity.current *= -.35
        }

        speed.current *= friction
        gravity.current += -.05

        setElement({
            index,
            position: position.toArray(),
            rotation,
            scale: [4.75 * speed.current, size, .1]
        })

        if (speed.current < .005) {
            remove(id)
        }
    })

    return null
}