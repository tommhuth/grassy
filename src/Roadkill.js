import { useFrame } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState, memo } from "react"
import { incrementRoadkills, removeRoadkill, reduceEngineHealth, useStore, setTrauma, setDebrisPosition } from "./data/store"
import { Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import animate from "@huth/animate"
import random from "@huth/random"

function Roadkill({ id, position, path, startIndex, speed }) {
    let ref = useRef()
    let [height] = useState(() => random.float(1.5, 3))
    let index = useRef(startIndex)
    let [ready, setReady] = useState(false) 
    let playerPosition = useMemo(() => new Vector3(), [])
    let playerAabb = useStore(i => i.player.obb)
    let obb = useMemo(() => new OBB(new Vector3(0, 0, 0), new Vector3(1 / 2, height / 2, 1 / 2)), [height])
    let tick = useRef(0)

    useEffect(() => {
        return useStore.subscribe(
            i => playerPosition.set(...i),
            state => state.player.position
        )
    }, [playerPosition])

    useEffect(() => {
        let p1 = path.getPointAt(index.current)
        let p2 = path.getPointAt(index.current + speed * 1.5)

        ref.current.position.x = p1.x
        ref.current.position.z = p1.z
        ref.current.lookAt(p2)

        animate({
            from: 50,
            to: position.y,
            duration: 2000,
            easing: "easeInOutQuint",
            render(val) {
                ref.current.position.y = val
            },
            end() {
                setReady(true)
            }
        })
    }, []) 

    useFrame(() => {
        if (path && ref.current && ready) {
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
        if (!ready) {
            return
        }

        tick.current++
        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.applyMatrix4(ref.current.matrixWorld)

        if (playerAabb.intersectsOBB(obb) && tick.current % 6 === 0) { 
            incrementRoadkills()
            reduceEngineHealth()
            setTrauma(1, .65)
            setDebrisPosition(ref.current.position.toArray())
            removeRoadkill(id)
        }
    })

    return (
        <group ref={ref}>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
                <boxBufferGeometry args={[1, height, 1]} />
                <meshLambertMaterial color={"#fff"} />
            </mesh>
        </group>
    )
}

export default memo(Roadkill)