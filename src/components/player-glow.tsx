import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Color, Mesh, ShaderMaterial } from "three"
import random from "@huth/random"
import { useStore } from "@lib/store"
import { playerGlow } from "@lib/materials"
import { maxSpeed, type Motion } from "@src/hooks/use-controls"

const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
        uColor: { value: new Color(playerGlow) },
        uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
    `,
    fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
            float falloff = 1. - clamp(length(vUv - .5) * 2., 0., 1.);

            gl_FragColor = vec4(uColor, smoothstep(0., 1., falloff) * uOpacity);

            #include <colorspace_fragment>
        }
    `,
})

export default function PlayerGlow({ motion }: { motion: Motion }) {
    const ref = useRef<Mesh>(null)

    useFrame(() => {
        let { player } = useStore.getState()

        if (!ref.current || !player.mesh) {
            return
        }

        ref.current.position.x = player.mesh.position.x
        ref.current.position.z = player.mesh.position.z

        let throttle = Math.max(Math.abs(motion.speed) / maxSpeed, player.active ? .35 : .25)

        ref.current.scale.setScalar(player.active ? random.float(2.6, 4.5) : random.float(2.6, 3.1))
        material.uniforms.uOpacity.value = (player.active ? random.float(.5, 1) : random.float(.4, .65)) * throttle
    })

    return (
        <mesh
            ref={ref}
            position-y={.02}
            rotation-x={-Math.PI / 2}
            material={material}
        >
            <planeGeometry args={[1, 1]} />
        </mesh>
    )
}
