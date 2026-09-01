import grassModel from "@assets/models/grass.glb"
import { setMatrixAt } from "@data/utils"
import random from "@huth/random"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { InstancedMesh } from "three"
import utils from "@src/shaders/utils.glsl"
import noise from "@src/shaders/noise.glsl"
import { cutTexture, grasscount, grassstep, overlapTexture, worldsize } from "./grasssim"
import { useShader } from "@data/hooks"
import GrassMaterial from "./grass-material"

const grassWildness = .975 // scale of noise height 

function Ground() {
    const { onBeforeCompile } = useShader({
        uniforms: {
            uWorldSize: { value: worldsize },
            uWildness: { value: grassWildness },
            uOcclusionLod: { value: 5 },
            uCutMap: { value: cutTexture },
            uOverlapMap: { value: overlapTexture },
        },
        shared: /* glsl */`
            varying vec3 vWorldPosition; 
            uniform float uWorldSize;
            uniform float uWildness; 
            uniform float uOcclusionLod; 
            uniform sampler2D uCutMap;
            uniform sampler2D uOverlapMap;
        `,
        vertex: {
            main: /* glsl */`
                vWorldPosition = (modelMatrix * vec4(transformed, 1.)).xyz;
            `
        },
        fragment: {
            head: /* glsl */`
                ${noise}
                ${utils}
            `,
            main: /* glsl */`
                vec3 darken = vec3(0. / 255., 5. / 255., 15. / 255.);
                float fadeDistance = 4.;
                float size = uWorldSize / 2. - fadeDistance * .25;
                float n = (1. - (noise(vWorldPosition.xz * .05) * .5 + .5) * uWildness)
                        * map(vWorldPosition.x, size, size + fadeDistance, 1., 0.)
                        * map(vWorldPosition.x, -size - fadeDistance, -size, 0., 1.)
                        * map(vWorldPosition.z, size, size + fadeDistance, 1., 0.)
                        * map(vWorldPosition.z, -size - fadeDistance, -size, 0., 1.);

                vec2 mapUv = (vWorldPosition.xz * vec2(1., -1.) + uWorldSize / 2.) / uWorldSize;
                float pushSoft = max(
                    textureLod(uOverlapMap, mapUv, uOcclusionLod).g,
                    textureLod(uCutMap, mapUv, uOcclusionLod).r
                );

                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb,
                    darken,
                    smoothstep(.0, 1., n * (1. - pushSoft))
                );
            `
        }
    })

    return (

        <mesh position={[0, -.05, 0]} receiveShadow>
            <boxGeometry args={[200, .1, 200]} />
            <meshLambertMaterial
                onBeforeCompile={onBeforeCompile}
                color={"#2c414d"}
            />
        </mesh>
    )
}

export default function Grass() {
    const [instance, setInstance] = useState<InstancedMesh | null>(null)
    const { nodes } = useGLTF(grassModel)
    const materialRef = useRef<GrassMaterial>(null)

    useEffect(() => {
        if (!instance) {
            return
        }

        let offset = (grasscount - 1) * grassstep / 2

        for (let xi = 0; xi < grasscount; xi++) {
            for (let zi = 0; zi < grasscount; zi++) {
                setMatrixAt({
                    instance,
                    index: xi * grasscount + zi,
                    position: [xi * grassstep - offset, 0, zi * grassstep - offset],
                    rotation: [0, random.float(-.5, .5), 0],
                    scale: 1
                })
            }
        }
    }, [instance])

    useFrame((state, delta) => {
        if (!materialRef.current) {
            return
        }

        materialRef.current.uniforms.uTime.value += delta
    })

    return (
        <>
            <instancedMesh
                ref={setInstance}
                args={[nodes.patch.geometry, undefined, grasscount * grasscount]}
            >
                <grassMaterial ref={materialRef} />
            </instancedMesh>
            <Ground />
        </>
    )
}

useGLTF.preload(grassModel)
