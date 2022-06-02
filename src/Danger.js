import { useEffect, useMemo, useRef } from "react"
import { Box3 } from "three"
import { addDanger, removeDanger } from "./data/store"

export default function Danger({ radius, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    let aabb = useMemo(() => new Box3(), [])
    let ref = useRef()

    useEffect(() => {
        aabb.setFromObject(ref.current)

        let id = addDanger({ position, aabb, radius, rotation })

        return () => {
            removeDanger(id)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aabb, radius])

    return (
        <mesh
            ref={ref}
            castShadow
            receiveShadow
            position={position}
            rotation={rotation}
        >
            <sphereBufferGeometry args={[radius, 12,12,12]} />
            <meshLambertMaterial color="white" />
        </mesh>
    )
}