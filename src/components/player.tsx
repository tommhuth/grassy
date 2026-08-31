import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import craftUrl from "@assets/models/craft.glb"
import { BoxObstacle, RoadkillObstacle, RockObstacle, setState, store, useStore } from "@data/store"
import { MeshPhongMaterial, Object3D, Sphere, Vector3 } from "three"
import { useControls } from "@src/hooks/use-controls"
import { OBB } from "three/examples/jsm/Addons.js"

const playerMaterial = new MeshPhongMaterial()

function setMesh(mesh: Object3D) {
    if (!mesh) return

    setState({
        player: {
            ...store.getState().player,
            mesh
        }
    })
}

const _direction = new Vector3()
const _sphere = new Sphere()

function getIntersection(obstacle: RockObstacle | RoadkillObstacle | BoxObstacle, obb: OBB, mesh: Object3D) {
    let direction = _direction.copy(mesh.position)

    if (obstacle.type === "box") {
        if (obb.intersectsOBB(obstacle.obb)) {
            return direction.sub(obstacle.obb.center)
        }
    } else {
        _sphere.center.set(...obstacle.position)
        _sphere.radius = obstacle.radius

        if (obb.intersectsSphere(_sphere)) {
            return direction.sub(_sphere.center)
        }
    }

    return null
}

export default function Player() {
    const { nodes } = useGLTF(craftUrl)
    const { motion } = useControls()

    useFrame((state, delta) => {
        let { player } = useStore.getState()

        if (!player.mesh) {
            return
        }

        player.mesh.position.x += Math.cos(motion.currentRotation) * motion.speed * delta
        player.mesh.position.z -= Math.sin(motion.currentRotation) * motion.speed * delta
        player.mesh.rotation.y = motion.currentRotation
    })

    useFrame(() => {
        let { obstacles, player: { mesh, obb, size } } = useStore.getState()

        if (!mesh) {
            return
        }

        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.halfSize.set(size[0] / 2, size[1] / 2, size[2] / 2)
        obb.applyMatrix4(mesh.matrixWorld)

        for (let obstacle of obstacles) {
            let intersection = getIntersection(obstacle, obb, mesh)

            if (intersection) {
                let push = .01

                intersection.multiplyScalar(push)
                mesh.position.x += intersection.x
                mesh.position.z += intersection.z

                obb.center.set(0, 0, 0)
                obb.rotation.identity()
                mesh.updateMatrixWorld()
                obb.applyMatrix4(mesh.matrixWorld)

                motion.speed = 0
                break
            }
        }
    })

    return (
        <group
            ref={setMesh}
            dispose={null}
            scale={1}
            position-y={.25}
        >
            <group rotation-y={Math.PI / 2}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_craft_cargoB.geometry}
                    material={playerMaterial}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_craft_cargoB_1.geometry}
                    material={playerMaterial}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_craft_cargoB_2.geometry}
                    material={playerMaterial}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_craft_cargoB_3.geometry}
                    material={playerMaterial}
                />
            </group>
        </group>
    )
}

useGLTF.preload(craftUrl)
