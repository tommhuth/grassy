import { useFrame } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState, memo } from "react"
import { incrementRoadkills, removeRoadkill, reduceEngineHealth, useStore, setTrauma, setDebrisPosition } from "./data/store"
import { Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import animate from "@huth/animate"
import random from "@huth/random"
import { box, lightGray, white } from "./global"

function Roadkill({ id, position, path, startIndex, speed }) {
    let ref = useRef()
    let [height] = useState(() => random.float(1.5, 3))
    let index = useRef(startIndex)
    let [ready, setReady] = useState(false)
    let playerObb = useStore(i => i.player.obb)
    let obb = useMemo(() => new OBB(new Vector3(0, 0, 0), new Vector3(1 / 2, height / 2, 1 / 2)), [height])
    let tick = useRef(0)

    useEffect(() => {
        let pointNow = path.getPointAt(index.current)
        let pointNext = path.getPointAt(index.current + speed * 1.5)

        ref.current.position.x = pointNow.x
        ref.current.position.z = pointNow.z
        ref.current.position.y = -6
        ref.current.lookAt(new Vector3(pointNext.x, -6, pointNext.z))

        animate({
            from: -6,
            to: 0,
            duration: 600,
            easing: "easeOutQuint",
            render(value) {
                ref.current.position.y = value
            },
            end() {
                setReady(true)
            }
        })
    }, [path, speed, height, position])

    useFrame(() => {
        if (path && ref.current && ready) {
            try {
                let point = path.getPointAt(index.current, position)

                ref.current.lookAt(point)
                ref.current.position.copy(point)

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

        if (playerObb.intersectsOBB(obb) && tick.current % 6 === 0) {
            incrementRoadkills()
            reduceEngineHealth()
            setTrauma(1, .65)
            setDebrisPosition(ref.current.position.toArray())
            removeRoadkill(id)
        }
    })

    return (
        <group ref={ref}>
            <mesh
                dispose={null}
                material={white}
                position={[0, height / 2, 0]}
                scale={[1, height, 1]}
                geometry={box}
                castShadow
                receiveShadow
            />
        </group>
    )
}

export default memo(Roadkill)