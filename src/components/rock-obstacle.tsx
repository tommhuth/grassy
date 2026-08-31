
import { useGLTF } from "@react-three/drei"

import rockModel from "@assets/models/rocks.glb"
import type { RockObstacle } from "@data/store"

export default function RockObstacle({
    radius,
    position,
    rotation,
    variant = 1
}: RockObstacle) {
    const { nodes } = useGLTF(rockModel)

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
            <meshLambertMaterial />
        </mesh>
    )
}


useGLTF.preload(rockModel)