import grassModel from "@assets/models/grass.glb"
import { setMatrixAt } from "@data/utils"
import random from "@huth/random"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { DoubleSide, InstancedMesh, ShaderMaterial, UniformsLib, UniformsUtils } from "three"
import easings from "@src/shaders/easings.glsl"
import utils from "@src/shaders/utils.glsl"
import noise from "@src/shaders/noise.glsl"
import { cutTexture, grasscount, grassstep, overlapTexture, worldsize } from "./grasssim"
import { useShader } from "@data/hooks"

const grassHeight = 1.5
const grassWildness = .975 // scale of noise height
const cutHeight = .15 // 0 - 1 scale 

const shared = /* glsl */`
    uniform sampler2D uCutMap;
    uniform sampler2D uOverlapMap;
    uniform float uWorldSize;
    uniform float uTime;
    uniform float uHeight;
    uniform float uWildness;
    uniform float uCutHeight;
    uniform float uOcclusionLod; 
    uniform float uMouseEffect;
    uniform vec3 uMousePosition;
    varying vec3 vWorldPosition;
    varying float vOcclusion;

    ${noise}
    ${easings}
    ${utils}
`

const vertexShader = /* glsl */`
    ${shared}

    #include <common>
    #include <shadowmap_pars_vertex>
    
    // from model, position of grass blade
    attribute vec3 _bladepos;

    void main() {   
        vec3 bladePosition = (modelMatrix * instanceMatrix * vec4(_bladepos, 1.)).xyz; 

        // three flips the y coord of textures 
        vec2 mapUv = (bladePosition.xz * vec2(1., -1.) + uWorldSize / 2.) / uWorldSize;

        vec4 overlap = texture2D(uOverlapMap, mapUv);
        // uv.y is 1 at the blade root, 0 at the tip 
        float bladeProgress = 1. - uv.y;
        float bladeMeshHeight = 2.73; // tallest blade in the mesh, only to put uCutHeight in mesh units
        // red channel = obstacles
        float gap = step(.05, overlap.r);
        // green channel = player trail, cut map = mowed
        float pushGrade = max(overlap.g, texture2D(uCutMap, mapUv).r);
       
        // height variation
        float baseHeightNoise = 1. - (noise(bladePosition.xz * .05) * .5 + .5) * uWildness;
        float bladeScale = max(
            (1. - pushGrade)
                * baseHeightNoise
                * uHeight // height scaler uniform
                * (1. - max(pushGrade, uCutHeight / bladeMeshHeight)),
            uCutHeight
        );

        float y = mix(position.y * bladeScale, -.1, gap);
        // one taper for wind + mouse: 0 at the root, 1 at the tip of every blade
        float heightEase = pow(bladeProgress, 1.5);
        float sway = heightEase * bladeScale / uHeight;
        float baseWindNoise = noise(bladePosition.xz * .025 + uTime) * .5 
            + noise(bladePosition.xz * .1 + uTime * 1.5) * .25;
        float wind = baseWindNoise * (1. - gap); 

        vec3 direction = uMousePosition - vec3(bladePosition.x, 0., bladePosition.z);
        float radius = 10.;
        float dist = length(direction);
        float mouseScale = 1. - clamp(dist / radius, 0., 1.);

        // every horizontal push, at full sway, in one vector
        vec3 bend = vec3(wind, 0., wind)
            - (direction / dist) * easeInOutQuad(mouseScale) * 2. * uMouseEffect;

        vec3 transformed = vec3(
            position.x,
            y,
            position.z 
        ) + bend * sway; 

        // sample lower res texture for auto soften map sample
        float pushSoft = max(
            textureLod(uOverlapMap, mapUv, uOcclusionLod).g,
            textureLod(uCutMap, mapUv, uOcclusionLod).r
        );
        
        // darken lower part of blade
        vOcclusion = baseHeightNoise
            * (1. - pushSoft)
            * easeOutQuart(map(transformed.y, 0., bladeMeshHeight, 1., 0.)); 

        vWorldPosition = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz;

        // shadow coord has to follow the displaced blade, not the model position
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(transformed, 1.);
        // the model has normals, so HAS_NORMAL is defined and the chunk expects this
        vec3 transformedNormal = normalMatrix * normal;

        #include <shadowmap_vertex>

        gl_Position = projectionMatrix 
            * modelViewMatrix 
            * instanceMatrix 
            * vec4(transformed, 1.);
    }
`

const fragmentShader = /* glsl */`
    ${shared}

    #include <packing>
    #include <shadowmap_pars_fragment>

    void main() {
        float shadow = getShadow(
            directionalShadowMap[0],
            directionalLightShadows[0].shadowMapSize,
            directionalLightShadows[0].shadowIntensity,
            directionalLightShadows[0].shadowBias,
            directionalLightShadows[0].shadowRadius,
            vDirectionalShadowCoord[0]
        );

        vec3 top = vec3(255. / 255., 242. / 255., 133. / 255.);
        vec3 bottom = vec3(0., 122. / 255., 100. / 255.);
        vec3 darken =  vec3(0. / 255., 10. / 255., 60. / 255.);

        gl_FragColor.a = 1.;
        gl_FragColor.rgb = mix(
            bottom,
            mix(
                top, 
                vec3(180. / 255., 235. / 255., 53. / 255.), 
                noise(vWorldPosition * .8) * .5 + .5
            ),
            clamp(vWorldPosition.y / (1.5 * uHeight), -.25, 1.)
        );

        gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            gl_FragColor.rgb * darken, 
            smoothstep(.1, 1., vOcclusion)
        );

         gl_FragColor.rgb = mix(
            gl_FragColor.rgb * .25,
            gl_FragColor.rgb,
            shadow
        );
    }
`

export default function Grass() {
    const [instance, setRef] = useState<InstancedMesh | null>(null)
    const { nodes } = useGLTF(grassModel)
    const materialRef = useRef<ShaderMaterial>(null)
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
                vec3 darken = vec3(0. / 255., 5. / 255., 5. / 255.);
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
    const uniforms = useMemo(() => {
        return {
            // needed by the shadowmap chunks, filled in by the renderer
            ...UniformsUtils.clone(UniformsLib.lights),
            uCutMap: { value: cutTexture },
            uOverlapMap: { value: overlapTexture },
            uWorldSize: { value: worldsize },
            uTime: { value: 0 },
            uHeight: { value: grassHeight },
            uWildness: { value: grassWildness },
            uCutHeight: { value: cutHeight },
            // mip map level, 0-9
            uOcclusionLod: { value: 5 },
            uMouseEffect: { value: 0 },
            uMousePosition: { value: [0, 0, 0] },
        }
    }, [])

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

        materialRef.current.uniforms.uTime.value += delta * .3
    })

    return (
        <>
            <instancedMesh
                ref={setRef}
                args={[nodes.patch.geometry, undefined, grasscount * grasscount]}
            >
                <shaderMaterial
                    ref={materialRef}
                    attach="material"
                    lights
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    side={DoubleSide}
                />
            </instancedMesh>
            <mesh position={[0, -.05, 0]} receiveShadow>
                <boxGeometry args={[200, .1, 200]} />
                <meshLambertMaterial
                    onBeforeCompile={onBeforeCompile}
                    color={"#333"}
                />
            </mesh></>

    )
}

useGLTF.preload(grassModel)
