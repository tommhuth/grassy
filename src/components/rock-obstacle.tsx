
import { useGLTF } from "@react-three/drei"

import rockModel from "@assets/models/rocks.glb"
import { useStore } from "@lib/store"
import type { RockObstacle } from "@src/types/obstacles"
import { useShader } from "@src/hooks/use-shader"
import { useFrame } from "@react-three/fiber"
import { damp } from "three/src/math/MathUtils.js"
import { Layers } from "three"
import { dilation, layers } from "@lib/sim/const"
import { sim } from "@lib/sim/sim"

// exclusive on purpose: the mask proxy below is for the sim bake only and
// should never show up in the main camera's render
const layer = new Layers()

layer.set(layers.obstacle)

export default function RockObstacle({
    radius,
    position,
    rotation,
    variant = 1
}: RockObstacle) {
    const { nodes } = useGLTF(rockModel)
    const { onBeforeCompile, customProgramCacheKey, uniforms } = useShader({
        uniforms: {
            uSurveying: { value: 0 },
        },
        shared: /* glsl */`
            uniform float uSurveying;
            varying vec3 vPosition;
        `,
        vertex: {
            main: /* glsl */`
                vPosition = position;
            `
        },
        fragment: {
            main: /* glsl */`
                // the camera is orthographic, so the view direction is a constant -z in view
                // space and the silhouette sits exactly where the normal turns perpendicular
                float facing = abs(normalize(vNormal).z);
                // soft falloff inwards from the silhouette
                float rimFalloff = 4.; // higher pulls the rim tighter to the silhouette
                float rim = mix(1., pow(max(1. - facing, 0.), rimFalloff), smoothstep(.25, .8, uSurveying));

                vec3 surveyColor = mix(
                    vec3(.8, 1., 1.),
                    vec3(.0, .2, 1.),
                    smoothstep(.3, .7, abs(facing) * uSurveying)
                );

                gl_FragColor.a = rim;
                gl_FragColor.rgb = mix(gl_FragColor.rgb, surveyColor, smoothstep(.25, .8, uSurveying));
            `
        }
    })

    useFrame((state, delta) => {
        let { player } = useStore.getState()

        uniforms.uSurveying.value = damp(
            uniforms.uSurveying.value,
            player.surveying ? 1 : 0,
            player.surveying ? 2.5 : 3,
            delta
        )
    })

    return (
        <>
            <mesh
                position={position}
                position-y={-.25}
                rotation-x={-Math.PI / 2}
                layers={layer}
            >
                <circleGeometry args={[radius + dilation, 16]} />
                <primitive object={sim.shaders.cut} attach="material" />
            </mesh>
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
                <meshLambertMaterial
                    transparent
                    onBeforeCompile={onBeforeCompile}
                    customProgramCacheKey={customProgramCacheKey}
                />
            </mesh>
        </>
    )
}


useGLTF.preload(rockModel)
