import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Box3, BoxBufferGeometry, Vector3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"
import { addObstalce } from "./data/store"
import { useModel } from "./hooks"

function Obstacle({
    position: [x, y, z] = [0, 0, 0],
    size: [width, height, depth],
    rotation = 0
}) {
    let ref = useRef()
    let obb = useMemo(() => {
        return new OBB()
    }, [])
    let model = useModel({ name: "box" })

    useEffect(() => {
        obb.halfSize = new Vector3(width / 2, height / 2, depth / 2)
    }, [width, height, depth, obb])

    useLayoutEffect(() => {
        ref.current.position.set(x, y, z)
        ref.current.rotation.y = rotation

        ref.current.updateMatrix()
        ref.current.updateMatrixWorld()

        obb.applyMatrix4(ref.current.matrixWorld)
    }, [x, y, z, rotation, obb])

    useEffect(() => {
        let aabb = new Box3().setFromObject(ref.current)

        addObstalce({
            position: [x, y, z],
            size: [width, height, depth],
            rotation,
            obb,
            aabb
        })
    }, [x, y, z, width, height, depth, rotation, obb])


    return (
        <mesh ref={ref} castShadow receiveShadow scale={[width, height, depth]}>
            <primitive object={model?.geometry || new BoxBufferGeometry()} attach="geometry" />
            <meshLambertMaterial color="#777" />
        </mesh>
    )
}

export default memo(Obstacle)