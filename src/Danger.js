import { useEffect, useMemo } from "react"
import { Box3, Matrix4, Quaternion, Vector3 } from "three"
import { addDanger, removeDanger } from "./data/store"
import { useModels } from "./models"

const _matrix = new Matrix4()
const _position = new Vector3()
const _scale = new Vector3()
const _quaternion = new Quaternion()

export default function Danger({ index, radius, position = [0, 0, 0] }) {
    let aabb = useMemo(() => new Box3(), [])
    let sphereInstance = useModels("sphere") 

    useEffect(() => {
        if (sphereInstance) {
            aabb.setFromCenterAndSize(_position.set(...position), _scale.set(radius, radius, radius))

            let id = addDanger({ position, aabb, radius })

            sphereInstance.setMatrixAt(index, _matrix.compose(
                _position.set(...position),
                _quaternion,
                _scale.set(radius, radius, radius)
            ))
            sphereInstance.instanceMatrix.needsUpdate = true

            return () => {
                removeDanger(id)
                sphereInstance.setMatrixAt(index, _matrix.compose(
                    _position.set(0, -100, 0),
                    _quaternion,
                    _scale.set(radius, radius, radius)
                ))
                sphereInstance.instanceMatrix.needsUpdate = true
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aabb, sphereInstance, radius])

    return null
}