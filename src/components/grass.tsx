import grassUrl from "@assets/models/grass.glb"
import { setMatrixAt } from "@data/utils"
import random from "@huth/random"
import { useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { DoubleSide, InstancedMesh, Plane, Raycaster, ShaderMaterial, Vector2, Vector3 } from "three"
import easings from "@src/shaders/easings.glsl"
import utils from "@src/shaders/utils.glsl"
import noise from "@src/shaders/noise.glsl"
import { cutTexture, grasscount, grassstep, overlapTexture, textsize, worldsize } from "./grasssim"
import { useShader } from "@data/hooks"

const grassHeight = 1.5
const grassWildness = .975 // scale of noise height
const cutHeight = .15 // 0 - 1 scale
const occlusionRadius = 1.25 // world units the occlusion averages over

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
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying float vOcclusion;

    ${noise}
    ${easings}
    ${utils}
`

const vertexShader = /* glsl */`
    ${shared}
    
    attribute vec3 _bladepos;

    void main() {
        vec3 wp = (modelMatrix * instanceMatrix * vec4(_bladepos, 1.)).xyz;
        vec3 wp2 = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz;

        vWorldPosition = wp2;

        // three flips the y coord of textures
        vec2 tuv = vec2((wp.x + uWorldSize / 2.) / uWorldSize, (-wp.z + uWorldSize / 2.) / uWorldSize);
        vec4 overlap = texture2D(uOverlapMap, tuv);
        // uv.y is 1 at the blade root, 0 at the tip 
        float bladeProgress = 1. - uv.y;
        float bladeMeshHeight = 2.73; // tallest blade in the mesh, only to put uCutHeight in mesh units
        // red channel = obstacles
        float gap = step(.05, overlap.r);
        // green channel = player trail, cut map = mowed
        float pushGrade = max(overlap.g, texture2D(uCutMap, tuv).r);
       
        float baseHeightNoise = 1. - (noise(wp.xz * .05) * .5 + .5) * uWildness;
        float bladeScale = max(
            (1. - pushGrade)
                * baseHeightNoise
                * uHeight // height scaler uniform
                * (1. - max(pushGrade, uCutHeight / bladeMeshHeight)),
            uCutHeight
        );

        // one taper for wind + mouse: 0 at the root, 1 at the tip of every blade
        float heightEase = pow(bladeProgress, 1.5);
        float sway = heightEase * bladeScale / uHeight;
        float baseWindNoise = noise(wp.xz * .025 + uTime) * .5 
            + noise(wp.xz * .1 + uTime * 1.5) * .25;
        float wind = baseWindNoise * (1. - gap);

        vec3 direction = uMousePosition - vec3(wp.x, 0., wp.z);
        float radius = 10.;
        float dist = length(direction);
        float mouseScale = 1. - clamp(dist / radius, 0., 1.);

        // every horizontal push, at full sway, in one vector
        vec3 bend = vec3(wind, 0., wind)
            - (direction / dist) * easeInOutQuad(mouseScale) * 2. * uMouseEffect;

        vec3 transformed = vec3(
            position.x,
            mix(position.y * bladeScale, -.1, gap),
            position.z
        ) + bend * sway;

        vPosition = transformed;

         // same push signal averaged over a neighbourhood; mip level n covers ~2^n texels.
        // three compiles this as GLSL ES 3.00, so it is textureLod, not texture2DLod
        float pushSoft = max(
            textureLod(uOverlapMap, tuv, uOcclusionLod).g,
            textureLod(uCutMap, tuv, uOcclusionLod).r
        );
        // deliberately keyed to the scaled height, not bladeProgress: tall blades then run
        // unoccluded over their top third, short ones stay dark all the way up
        vOcclusion = baseHeightNoise
            * (1. - pushSoft)
            * easeOutQuart(map(transformed.y, 0., bladeMeshHeight, 1., 0.));

        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(transformed, 1.);
    }
`

const fragmentShader = /* glsl */`
    ${shared}

    void main() {
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
            clamp(vPosition.y / (1.5 * uHeight), -.25, 1.)
        );

        gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            gl_FragColor.rgb * darken, 
            smoothstep(.1, 1., vOcclusion)
        );
    }
`

const _plane = new Plane(new Vector3(0, 1, 0), 0)
const _pointer = new Vector2()
const _hit = new Vector3()

export default function Grass() {
    const [instance, setRef] = useState<InstancedMesh | null>(null)
    const { nodes } = useGLTF(grassUrl)
    const { camera } = useThree()
    const materialRef = useRef<ShaderMaterial>(null)
    const targetMousePosition = useRef<[number, number, number]>([0, 0, 0])
    const isMovingMouse = useRef(false)
    const { onBeforeCompile } = useShader({
        uniforms: {
            uWorldSize: { value: worldsize },
            uWildness: { value: grassWildness },
        },
        shared: /* glsl */`
            varying vec3 vWorldPosition;
            uniform float uWildness;
            uniform float uWorldSize;
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
                float extra = 3.;
                float size = uWorldSize / 2. - extra * .25;
                float n = (1. - (noise(vWorldPosition.xz * .05) * .5 + .5) * uWildness)
                        * map(vWorldPosition.x, size, size + extra, 1., 0.)
                        * map(vWorldPosition.x, -size - extra, -size, 0., 1.)
                        * map(vWorldPosition.z, size, size + extra, 1., 0.)
                        * map(vWorldPosition.z, -size - extra, -size, 0., 1.);

                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb,
                    darken,
                    smoothstep(.0, 1., n)
                );
            `
        }
    })
    const uniforms = useMemo(() => {
        return {
            uCutMap: { value: cutTexture },
            uOverlapMap: { value: overlapTexture },
            uWorldSize: { value: worldsize },
            uTime: { value: 0 },
            uHeight: { value: grassHeight },
            uWildness: { value: grassWildness },
            uCutHeight: { value: cutHeight },
            // texels per world unit is textsize / worldsize, and mip level n covers ~2^n texels
            uOcclusionLod: { value: 5 },
            uMouseEffect: { value: 0 },
            uMousePosition: { value: [0, 0, 0] },
        }
    }, [])

    useEffect(() => {
        if (!instance) {
            return
        }

        // centre the grid on the origin: the outermost patch centres sit at +/- half the span
        let offset = (grasscount - 1) * grassstep / 2

        for (let xi = 0; xi < grasscount; xi++) {
            for (let zi = 0; zi < grasscount; zi++) {
                setMatrixAt({
                    instance,
                    index: xi * grasscount + zi,
                    position: [xi * grassstep - offset, 0, zi * grassstep - offset],
                    // rotation: [0, random.float(-.5, .5), 0],
                    scale: 1
                })
            }
        }
    }, [instance])

    useEffect(() => {
        let raycaster = new Raycaster()
        let tid: ReturnType<typeof setTimeout>

        let onPointerMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return

            _pointer.x = (e.clientX / window.innerWidth) * 2 - 1
            _pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

            raycaster.setFromCamera(_pointer, camera)

            if (materialRef.current && raycaster.ray.intersectPlane(_plane, _hit)) {
                let { uMouseEffect } = materialRef.current.uniforms

                targetMousePosition.current = [_hit.x, 4, _hit.z]
                uMouseEffect.value = Math.min(uMouseEffect.value + .01, 1)
                isMovingMouse.current = true

                clearTimeout(tid)
                tid = setTimeout(() => {
                    isMovingMouse.current = false
                }, 150)
            }
        }

        window.addEventListener("pointermove", onPointerMove)

        return () => {
            clearTimeout(tid)
            window.removeEventListener("pointermove", onPointerMove)
        }
    }, [camera])

    useFrame((state, delta) => {
        if (!materialRef.current) {
            return
        }

        let { uMousePosition, uMouseEffect, uTime } = materialRef.current.uniforms
        let mouse = uMousePosition.value

        if (!isMovingMouse.current) {
            uMouseEffect.value *= 1 - delta * .6
        }

        mouse[0] += (targetMousePosition.current[0] - mouse[0]) * delta * 1.5
        mouse[2] += (targetMousePosition.current[2] - mouse[2]) * delta * 1.5
        mouse[1] = 3

        uTime.value += delta * .3
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
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    side={DoubleSide}
                />
            </instancedMesh>
            <mesh position={[0, -.05, 0]}>
                <boxGeometry args={[200, .1, 200]} />
                <meshPhongMaterial onBeforeCompile={onBeforeCompile} color={"#333"} />
            </mesh></>

    )
}

useGLTF.preload(grassUrl)
