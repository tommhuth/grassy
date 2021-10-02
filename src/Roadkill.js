import { useFrame } from "@react-three/fiber"
import {useRef,useMemo,useEffect, useState } from "react"
import { removeRoadkill } from "./data/store"
import { CatmullRomCurve3, Vector3 } from "three"
import random from "@huth/random" 

let paths = [
    new CatmullRomCurve3([
        new Vector3(-25, 0, -25),
        new Vector3(-10, 0, 13),
        new Vector3(9, 0, 8),
        new Vector3(25, 0, -12)
    ])
]
let i = 0

export {paths}

export default function Roadkill({ id, position }) {
    let ref = useRef()
    let [path, setPath] = useState()
    let speed = useRef(random.pick(-.00075, .00075))
    let index = useRef(speed.current > 0 ? 0.000001 : .999999)
    let vec = useMemo(() => new Vector3(), [])

    useEffect(() => {
        setPath(paths[i])

        i = (i + 1) % paths.length
    }, [])

    useFrame(() => {
        try {
            if (path && ref.current && position) {
                let p = path.getPointAt(index.current, vec)

                ref.current.lookAt(p)

                ref.current.position.x = p.x
                ref.current.position.z = p.z
                ref.current.position.y = p.y
                position.set(p.x, p.y, p.z)

                index.current += speed.current
            }
        } catch (e) {
            // must be out of bounds
            removeRoadkill(id)
        }
    })

    return (
        <mesh ref={ref}>
            <boxBufferGeometry args={[1, 4, 1]} />
            <meshLambertMaterial color={"darkgray"} />
        </mesh>
    )
}