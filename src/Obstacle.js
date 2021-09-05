import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Box3, Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import { addObstalce } from "./data/store"

export default function Obstacle({ position = [0,0,0], size, rotation = 0 }) {
    let ref = useRef()
    let obb = useMemo(() => {
        return new OBB()
    }, [])

    useEffect(() => {
        obb.halfSize = new Vector3(...size.map(i => i / 2))
    }, [size, obb])

    useLayoutEffect(() => {
        ref.current.position.set(...position)
        ref.current.rotation.y = rotation

        ref.current.updateMatrix()
        ref.current.updateMatrixWorld()

        obb.applyMatrix4(ref.current.matrixWorld)
    }, [])

    useEffect(() => {
        let aabb = new Box3().setFromObject(ref.current)

        addObstalce({ position, size, rotation, obb, aabb })
    }, [])

    return (
        <mesh ref={ref}>
            <boxBufferGeometry args={size} />
            <meshLambertMaterial color="gray" />
        </mesh>
    )
}