import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import craftUrl from "@assets/models/craft.glb"
import { removeAlien, setState, useStore } from "@lib/store"
import type { AlienObstacle, RockObstacle } from "@src/types/obstacles"
import { Object3D, Sphere, Vector3 } from "three"
import { layers } from "@lib/sim/const"
import { craftCabin, craftHull, craftWindows, craftWings, playerGlow } from "@lib/materials"
import { useControls } from "@src/hooks/use-controls"
import { OBB } from "three/examples/jsm/Addons.js"
import GrassParticles from "./grass-particles"
import AlienParticles, { createAlienParticles } from "./alien-particles"
import PlayerGlow from "./player-glow"

function setMesh(mesh?: Object3D | null) {
    if (!mesh) return

    // layers do not inherit, projectObject tests every object on its own, so
    // the leaf meshes need it and not just the group
    mesh.traverse(i => i.layers.enable(layers.trail))

    setState({
        player: {
            ...useStore.getState().player,
            mesh
        }
    })
}

const _direction = new Vector3()
const _sphere = new Sphere()

const alienCollisionScale = .5

function getIntersection(obstacle: RockObstacle | AlienObstacle, obb: OBB, mesh: Object3D) {
    let direction = _direction.copy(mesh.position)

    _sphere.center.set(...obstacle.position)
    _sphere.radius = obstacle.type === "alien"
        ? obstacle.radius * alienCollisionScale
        : obstacle.radius

    if (obb.intersectsSphere(_sphere)) {
        return direction.sub(_sphere.center)
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
                if (obstacle.type === "alien") {
                    createAlienParticles({
                        position: obstacle.position
                    })
                    removeAlien(obstacle.id)

                    break
                }

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
        <>
            <GrassParticles />
            <PlayerGlow motion={motion} />
            <group
                ref={setMesh}
                dispose={null}
                scale={1}
                position-y={.25}
            >
                <pointLight
                    color={playerGlow}
                    position={[0, .5, 0]}
                    intensity={2}
                />
                <group rotation-y={-Math.PI / 2}>
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Mesh_craft_cargoB.geometry}
                        material={craftHull}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Mesh_craft_cargoB_1.geometry}
                        material={craftCabin}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Mesh_craft_cargoB_2.geometry}
                        material={craftWindows}
                    />
                    <mesh
                        castShadow
                        receiveShadow
                        geometry={nodes.Mesh_craft_cargoB_3.geometry}
                        material={craftWings}
                    />
                </group>
            </group>
        </>
    )
}

useGLTF.preload(craftUrl)
