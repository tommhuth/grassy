import { useFrame } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState, memo } from "react"
import { removeRoadkill, useStore } from "./data/store"
import { Vector3 } from "three"
import { Only } from "./utils"
import Config from "./Config"
import { OBB } from "three/examples/jsm/math/OBB"

function Roadkill({ id, position, path, startIndex, speed }) {
    let ref = useRef()
    let tid = useRef()
    let index = useRef(startIndex)
    let [hit, setHit] = useState(false)
    let playerPosition = useMemo(() => new Vector3(), [])
    let playerAabb = useStore(i => i.player.obb)
    let obb = useMemo(() => new OBB(new Vector3(0,0,0), new Vector3(1 / 2, 2 / 2, 1 / 2)), [])
    let r = useRef(0)

    useEffect(() => {
        return useStore.subscribe(
            i => playerPosition.set(...i),
            state => state.player.position
        )
    }, [playerPosition])

    useFrame(() => {
        if (path && ref.current && !hit) {
            try {
                let p = path.getPointAt(index.current, position)

                ref.current.lookAt(p)
                ref.current.position.copy(p)

                index.current += speed
            } catch (e) {
                // must be out of bounds
                removeRoadkill(id)
            }
        }
    })

    useFrame(() => {
        r.current++
        obb.center.set(0, 0, 0)
        obb.rotation.identity() 
        obb.applyMatrix4(ref.current.matrixWorld) 

        if (playerAabb.intersectsOBB(obb) && !hit && r.current % 6 === 0) {
            setHit(true) 
        } 
    })

    useEffect(() => {
        if (hit) {
            tid.current = setTimeout(() => removeRoadkill(id, true), 100)

            return () => {
                clearTimeout(tid.current)
            }
        }
    }, [hit, id])

    return (
        <group ref={ref}>
            <Only if={Config.DEBUG}>
                <axesHelper scale={8} />
            </Only>
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <boxBufferGeometry args={[1, 2, 1]} />
                <meshLambertMaterial color={"darkgray"} />
            </mesh>
        </group>
    )
}

export default memo(Roadkill)