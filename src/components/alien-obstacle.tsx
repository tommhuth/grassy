import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useLayoutEffect, useMemo, useRef } from "react"
import { Group, Vector3 } from "three"
import random from "@huth/random"
import alienUrl from "@assets/models/alien.glb"
import { removeAlien } from "@lib/store"
import { clamp } from "@lib/utils"
import { layers } from "@lib/sim/const"
import { alienAccent, alienGlow, alienLeg, alienShell, alienTrim } from "@lib/materials"
import type { AlienObstacle } from "@src/types/obstacles"

function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2
}

const _v = new Vector3()
const _tangent = new Vector3()

export default function AlienObstacle({ id, radius, direction, path: { curve }, position }: AlienObstacle) {
    const { nodes } = useGLTF(alienUrl)
    let ref = useRef<Group>(null)
    let data = useMemo(() => {
        let duration = random.float(45_000, 70_000)

        return {
            time: direction === -1 ? duration : 0,
            duration,
        }
    }, [])

    useLayoutEffect(() => {
        // layers do not inherit, so the leaf meshes need it and not just the group
        ref.current?.traverse(i => i.layers.enable(layers.trail))
    }, [])

    useFrame((state, delta) => {
        if (!ref.current) {
            return
        }

        if ((data.time < 0 && direction === -1) || (data.time > data.duration && direction === 1)) {
            return removeAlien(id)
        }

        let t = easeInOutSine(clamp(data.time / data.duration))
        let p1 = curve.getPointAt(t, _v)
        let tangent = curve.getTangentAt(t, _tangent)
            .multiplyScalar(direction)

        ref.current.position.copy(p1)
        ref.current.position.y = Math.sin(state.time * .005) * .1 + .2
        ref.current.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI
        data.time += delta * 1_000 * direction

        position[0] = p1.x
        position[1] = p1.y
        position[2] = p1.z
    })

    return (
        <group
            ref={ref}
            dispose={null}
            scale={radius * 2}
        >
            <group
                position={[-.13, .473, 0]}
                scale={.858}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armLeft.geometry}
                    material={alienGlow}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armLeft_1.geometry}
                    material={alienTrim}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armLeft_2.geometry}
                    material={alienAccent}
                />
            </group>
            <group position={[.13, .473, 0]}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armRight.geometry}
                    material={alienGlow}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armRight_1.geometry}
                    material={alienAccent}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_armRight_2.geometry}
                    material={alienTrim}
                />
            </group>
            <group position={[0, .223, 0]}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_body.geometry}
                    material={alienShell}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_body_1.geometry}
                    material={alienTrim}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_body_2.geometry}
                    material={alienAccent}
                />
            </group>
            <group position={[0, .483, 0]} scale={.26}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_head.geometry}
                    material={alienGlow}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_head_1.geometry}
                    material={alienLeg}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_head_2.geometry}
                    material={alienTrim}
                />
            </group>
            <group position={[-.13, .223, 0]}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legLeft.geometry}
                    material={alienShell}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legLeft_1.geometry}
                    material={alienLeg}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legLeft_2.geometry}
                    material={alienTrim}
                />
            </group>
            <group
                position={[.13, .223, 0]}
                scale={.858}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legRight.geometry}
                    material={alienLeg}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legRight_1.geometry}
                    material={alienShell}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Mesh_legRight_2.geometry}
                    material={alienTrim}
                />
            </group>
        </group>
    )
}

useGLTF.preload(alienUrl)
