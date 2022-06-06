import { useFrame, useThree, useLoader } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { DoubleSide, Matrix4, Vector3, MeshBasicMaterial, Quaternion, RGBADepthPacking } from "three"
import { useStore } from "./data/store"
import grassTransform from "./grassTransform.glsl"
import random from "@huth/random"
import { glsl } from "./utils"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export default function Grass() {
    let { scene } = useLoader(GLTFLoader, "/models/grass.glb")
    let model = scene?.children?.[0]
    let [ref, setRef] = useState()
    let { viewport } = useThree()
    let targetMousePosition = useRef([0, 0, 0])
    let size = useStore(i => i.world.size)
    let wildness = useStore(i => i.world.grassWildness)
    let height = useStore(i => i.world.grassHeight)
    let windScale = useStore(i => i.world.grassWindScale)
    let grassNoiseScale = useStore(i => i.world.grassNoiseScale)
    let cutTexture = useStore(i => i.world.cutTexture)
    let gapTexture = useStore(i => i.world.gapTexture)
    let cutHeight = useStore(i => i.player.cutHeight)
    let playerPositionTexture = useStore(i => i.world.playerPositionTexture)
    let counter = useRef(0)
    let { material, uniforms } = useMemo(() => {
        let uniforms = {
            height: { value: height, type: "f" },
            randomizer: { value: Math.random(), type: "f" },
            canvasCross: { value: 0, type: "f" },
            cameraCenterPosition: { value: [0, 0, 0], type: "v3" },
            time: { value: 0, type: "f" },
            mouseEffect: { value: 0, type: "f" },
            mousePosition: { value: [0, 0, 0], type: "v3" },
            size: { value: size, type: "f" },
            windScale: { value: windScale, type: "f" },
            wildness: { value: wildness, type: "f" }, // subraction of base height
            scale: { value: grassNoiseScale, type: "f" }, // scale of noise of wildness
            cutHeight: { value: .15, type: "f" },
            cut: { value: null, type: "t" },
            gap: { value: null, type: "t" },
            playerPosition: { value: null, type: "t" }
        }
        let material = new MeshBasicMaterial({
            wireframe: false,
            transparent: true,
            side: DoubleSide,
            onBeforeCompile(shader) {
                shader.vertexShader = shader.vertexShader.replace("#include <common>", glsl`
                    #include <common>
                    
                    uniform float time; 
                    uniform float windScale;
                    uniform float randomizer;
                    uniform float height;
                    uniform vec3 mousePosition;
                    uniform float cutHeight;
                    uniform float canvasCross;
                    uniform float wildness;
                    uniform float mouseEffect;
                    uniform vec3 cameraCenterPosition;
                    uniform float scale;
                    uniform sampler2D cut;
                    uniform sampler2D playerPosition;
                    uniform sampler2D gap;
                    uniform float size;  
                    varying vec3 vPosition;
                    flat out int vIgnore;

                    ${grassTransform}
                `)
                shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", glsl`
                    #include <begin_vertex>
            
                    vec4 globalPosition = instanceMatrix *  vec4(position, 1.);
            
                    globalPosition = modelMatrix * globalPosition;
            
                    transformed =  grassTransform(position, globalPosition.xyz) ; 

                    vPosition = transformed;

                    if (length(cameraCenterPosition - globalPosition.xyz) > canvasCross) {
                        vIgnore = 1;
                    } else {
                        vIgnore = 0;
                    }
                `)
                shader.uniforms = {
                    ...shader.uniforms,
                    ...uniforms
                }

                shader.fragmentShader = shader.fragmentShader.replace("#include <common>", glsl`
                    #include <common> 

                    varying vec3 vPosition; 
                    uniform float height; 
                    flat in int vIgnore;  
                `)
                shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", glsl` 

                    if (vIgnore == 1) {
                        discard;
                    } 

                    vec3 top = vec3(255./255., 242./255., 133./255.);
                    vec3 bottom = vec3(0., 122./255., 100./255.);  

                    gl_FragColor = vec4(mix(bottom, top, clamp((vPosition.y - 1.) / height, -.25, 1.)), clamp(vPosition.y / .25, 0., 1.));
                `)
            }
        })

        return { uniforms, material }
    }, [grassNoiseScale, wildness, height, size, windScale])
    let tid = useRef()
    let [isMovingMouse, setIsMovingMouse] = useState(false)

    useEffect(() => {
        let diagonal = Math.sqrt(viewport.width ** 2 + viewport.height ** 2)

        uniforms.canvasCross.value = diagonal * .75
        uniforms.canvasCross.needsUpdate = true
    }, [viewport, uniforms, size])

    useEffect(() => {
        useStore.subscribe(position => {
            uniforms.cameraCenterPosition.value = [position[0] + 2, 0, position[2] - 2]
            uniforms.cameraCenterPosition.needsUpdate = true
        }, state => state.player.position)
    }, [uniforms,])

    useEffect(() => {
        uniforms.cut.value = cutTexture
    }, [uniforms, cutTexture])


    useEffect(() => {
        uniforms.cutHeight.value = cutHeight
    }, [uniforms, cutHeight])

    useEffect(() => {
        uniforms.height.value = height
        uniforms.height.needsUpdate = true
    }, [uniforms, height])

    useEffect(() => {
        uniforms.gap.value = gapTexture
    }, [uniforms, gapTexture])

    useEffect(() => {
        uniforms.playerPosition.value = playerPositionTexture
    }, [uniforms, playerPositionTexture])

    useFrame(() => { 
        if (!isMovingMouse) {
            uniforms.mouseEffect.value *= .99
        }

        uniforms.mousePosition.value[0] += (targetMousePosition.current[0] - uniforms.mousePosition.value[0]) * .025
        uniforms.mousePosition.value[2] += (targetMousePosition.current[2] - uniforms.mousePosition.value[2]) * .025
        uniforms.mousePosition.value[1] = 3

        if (counter.current % 2 === 0) {
            uniforms.mousePosition.needsUpdate = true
            uniforms.mouseEffect.needsUpdate = true 
        }

        if (uniforms.cut.value && counter.current % 10 === 0) { 
            uniforms.cut.needsUpdate = true
        }

        if (uniforms.playerPosition.value && counter.current % 5 === 0) {
            uniforms.playerPosition.needsUpdate = true
        }

        uniforms.time.value += .005
        uniforms.time.needsUpdate = true
        counter.current++
    })

    useEffect(() => {
        if (ref && model?.geometry) {
            let partSize = 3.75
            let i = 0
            let matrix = new Matrix4()
            let position = new Vector3()
            let scale = new Vector3(1, 1, 1)
            let rotation = new Quaternion()
            let y = new Vector3(0, 1, 0)

            for (let x = 0; x < Math.floor(size / partSize); x += 1) {
                for (let z = 0; z < Math.floor(size / partSize); z += 1) {
                    rotation.setFromAxisAngle(y, random.float(.1, .75))

                    position.set(
                        partSize * x - (size) / 2 + partSize / 2,
                        0,
                        partSize * z - (size) / 2 + partSize / 2
                    )

                    ref.setMatrixAt(i, matrix.compose(position, rotation, scale))
                    i++
                }
            }

            ref.instanceMatrix.needsUpdate = true
        }
    }, [ref, size, model?.geometry])

    return (
        <>
            <instancedMesh
                position={[0, 0, 0]}
                ref={setRef}
                args={[model?.geometry, material, size * size]}
                receiveShadow
                castShadow
            >
                <meshDepthMaterial
                    attach="customDepthMaterial"
                    args={[{
                        depthPacking: RGBADepthPacking,
                        alphaTest: .5,
                        onBeforeCompile(shader) {
                            const chunk = glsl`
                                #include <begin_vertex>

                                vec4 globalPosition = instanceMatrix * vec4(position, 1.);
            
                                globalPosition = modelMatrix * globalPosition; 
                                transformed = grassTransform(position, globalPosition.xyz);
                            `

                            shader.uniforms = {
                                ...shader.uniforms,
                                ...uniforms
                            }

                            shader.vertexShader = glsl`
                                uniform float time;
                                uniform float randomizer;
                                uniform float windScale;
                                uniform float height;
                                uniform float cutHeight;
                                uniform float mouseEffect;
                                uniform float wildness;
                                uniform float scale;
                                uniform vec3 mousePosition;
                                uniform sampler2D cut;
                                uniform sampler2D playerPosition;
                                uniform sampler2D gap;
                                uniform float size;

                                ${grassTransform}
                                ${shader.vertexShader}
                            `.replace("#include <begin_vertex>", chunk)
                        },
                    }]}
                />
            </instancedMesh>

            <mesh
                onPointerMove={({ point }) => {
                    setIsMovingMouse(true)
                    targetMousePosition.current = [point.x, 4, point.z]
                    uniforms.mouseEffect.value = Math.min(uniforms.mouseEffect.value + .01, 1)
                    uniforms.mouseEffect.needsUpdate = true

                    clearTimeout(tid.current)
                    tid.current = setTimeout(()=> {
                        setIsMovingMouse(false)
                    }, 150)
                }}
                position={[0, 0, 0]}
                receiveShadow
                rotation-x={-Math.PI / 2}
            >
                <meshLambertMaterial color="#888" />
                <planeBufferGeometry args={[200, 200, 1, 1]} />
            </mesh>
        </>
    )
}