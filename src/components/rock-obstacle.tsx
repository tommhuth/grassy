
import { useGLTF } from "@react-three/drei"

import rockModel from "@assets/models/rocks.glb"
import { useStore } from "@lib/store"
import type { RockObstacle } from "@src/types/obstacles"
import { useRef } from "react"
import { MeshLambertMaterial } from "three"
import { useFrame } from "@react-three/fiber"

export default function RockObstacle({
    radius,
    position,
    rotation,
    variant = 1
}: RockObstacle) {
    const { nodes } = useGLTF(rockModel)
    const materialRef = useRef<MeshLambertMaterial>(null)

    useFrame(() => {
        if (!materialRef.current) {
            return
        }

        let { player } = useStore.getState()

        materialRef.current.wireframe = player.surveying
    })

    return (
        <mesh
            dispose={null}
            position={position}
            rotation-y={rotation}
            scale={radius * 2}
            position-y={-.25}
            receiveShadow
            castShadow
            geometry={nodes["rock" + variant].geometry}
        >
            <meshLambertMaterial ref={materialRef} />
        </mesh>
    )
}


useGLTF.preload(rockModel)