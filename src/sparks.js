import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Color, Matrix4, Quaternion, Vector3 } from "three"
import { useStore } from "./data/store"


let _matrix = new Matrix4()
let _rotation = new Quaternion()
let _position = new Vector3(0, 0, 0)
let _scale = new Vector3(1, 1, 1)
let _y = new Vector3(0, 1, 0)
let _color = new Color()
let index = 0

export default function Sparks({ count = 100 }) {
    let [instance, setInstance] = useState()
    let [sparks, setSparks] = useState([])
    let inDanger = useStore(i => i.player.inDanger)
    let bladesActive = useStore(i => i.player.bladesActive)
    let setElement = useCallback(({ index, position, rotation, scale }) => {
        if (instance) {
            instance.setMatrixAt(index, _matrix.compose(
                _position.set(...position),
                _rotation.setFromAxisAngle(_y, rotation),
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
                size: random.float(inDanger ? .1 : .05, inDanger ? .2 : .1),
                index: index % count,
                color: inDanger ? random.pick("rgb(0,255,0)", "yellow", "rgb(0,255,0)", "white") : random.pick("rgb(0,255,0)"),
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