import { useEffect, useMemo, useRef } from "react"
import { Box3 } from "three"
import { addDanger } from "./data/store"

export default function Danger({ radius, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    let aabb = useMemo(() => new Box3(), [])
    let ref = useRef()

    useEffect(() => {
        aabb.setFromObject(ref.current)

        addDanger({ position, aabb, radius, rotation })
    }, [aabb, radius])

    return (
        <mesh
            ref={ref}
            castShadow
            receiveShadow
            position={position}
            rotation={rotation}
        >
            <sphereBufferGeometry args={[radius]} />
            <meshLambertMaterial />
        </mesh>
    )
}