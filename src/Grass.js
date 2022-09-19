import { useFrame, useThree, useLoader } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { Matrix4, Vector3, MeshBasicMaterial, Quaternion, Raycaster, Vector2 } from "three"
import { useStore } from "./data/store"
import grassTransform from "./grassTransform.glsl"
import random from "@huth/random"
import { glsl } from "./utils"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export default function Grass() {
    let { scene } = useLoader(GLTFLoader, "/models/grass.glb")
    let model = scene?.children?.[0]
    let [ref, setRef] = useState()
    let { viewport, camera } = useThree()
    let targetMousePosition = useRef([0, 0, 0])
    let size = useStore(i => i.world.size)
    let wildness = useStore(i => i.world.grassWildness)
    let height = useStore(i => i.world.grassHeight)  
    let cutTexture = useStore(i => i.world.cutTexture)
    let gapTexture = useStore(i => i.world.gapTexture)
    let cutHeight = useStore(i => i.player.cutHeight)
    let playerPositionTexture = useStore(i => i.world.playerPositionTexture)
    let counter = useRef(0) 
    let partScaler = 1.25
    let partSize = 9.5
    let partCount = Math.round(size/partSize)
    let { material, uniforms } = useMemo(() => {
        let uniforms = {
            uHeight: { value: height, type: "f" }, 
            uCanvasCross: { value: 0, type: "f" },
            uCameraCenterPosition: { value: [0, 0, 0], type: "v3" },
            uTime: { value: 0, type: "f" },
            uMouseEffect: { value: 0, type: "f" },
            uMousePosition: { value: [0, 0, 0], type: "v3" },
            uSize: { value: size, type: "f" }, 
            uWildness: { value: wildness, type: "f" }, // scale of noise height 
            uCutHeight: { value: .45, type: "f" }, // 0 - 1 scale
            uCut: { value: null, type: "t" },
            uGap: { value: null, type: "t" },
            uPlayerPosition: { value: null, type: "t" }
        }
        let material = new MeshBasicMaterial({
            wireframe: false,
            transparent: true,
            precision: "mediump", 
            onBeforeCompile(shader) {
                shader.vertexShader = shader.vertexShader.replace("#include <common>", glsl`
                    #include <common>
                    
                    uniform float uTime;   
                    uniform float uHeight;
                    uniform vec3 uMousePosition;
                    uniform float uCutHeight;
                    uniform float uCanvasCross;
                    uniform float uWildness;
                    uniform float uMouseEffect;
                    uniform vec3 uCameraCenterPosition; 
                    uniform sampler2D uCut;
                    uniform sampler2D uPlayerPosition;
                    uniform sampler2D uGap;
                    uniform float uSize;  
                    varying vec3 vPosition;
                    flat out int vIgnore;

                    ${grassTransform}
                `)
                shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", glsl`
                    #include <begin_vertex>
            
                    vec4 globalPosition = instanceMatrix *  vec4(position, 1.);
            
                    globalPosition = modelMatrix * globalPosition; 

                    if (length(uCameraCenterPosition - globalPosition.xyz) > uCanvasCross * .75) {
                        vIgnore = 1;
                    } else {
                        vIgnore = 0; 
                        transformed = grassTransform(position, globalPosition.xyz);  
                        vPosition = transformed;
                    }
                `)
                shader.uniforms = {
                    ...shader.uniforms,
                    ...uniforms
                }

                shader.fragmentShader = shader.fragmentShader.replace("#include <common>", glsl`
                    #include <common> 

                    varying vec3 vPosition; 
                    uniform float uHeight; 
                    flat in int vIgnore;  
                `)
                shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", glsl` 
                    if (vIgnore == 1) {
                        discard;
                    } 

                    vec3 top = vec3(255./255., 242./255., 133./255.);
                    vec3 bottom = vec3(0., 122./255., 100./255.);  

                    gl_FragColor = vec4(
                        mix(bottom, top, clamp((vPosition.y ) / (1.5 * uHeight), -.25, 1.)), 
                        clamp(vPosition.y / .25, 0., 1.)
                    );
                `)
            }
        })

        return { uniforms, material }
    }, [wildness, height, size])
    let isMovingMouse = useRef(false)
    let planeRef = useRef()  

    useEffect(() => {
        let diagonal = Math.sqrt(viewport.width ** 2 + viewport.height ** 2)

        uniforms.uCanvasCross.value = diagonal * .9
        uniforms.uCanvasCross.needsUpdate = true
    }, [viewport, uniforms, size])

    useEffect(() => {
        useStore.subscribe(position => {
            uniforms.uCameraCenterPosition.value = [position[0] + 2, 0, position[2] - 2]
            uniforms.uCameraCenterPosition.needsUpdate = true
        }, state => state.player.position)
    }, [uniforms,])

    useEffect(() => {
        uniforms.uCut.value = cutTexture
    }, [uniforms, cutTexture])


    useEffect(() => {
        uniforms.uCutHeight.value = cutHeight
    }, [uniforms, cutHeight])

    useEffect(() => {
        uniforms.uHeight.value = height
        uniforms.uHeight.needsUpdate = true
    }, [uniforms, height])

    useEffect(() => {
        uniforms.uGap.value = gapTexture
    }, [uniforms, gapTexture])

    useEffect(() => {
        uniforms.uPlayerPosition.value = playerPositionTexture
    }, [uniforms, playerPositionTexture])


    useFrame(() => {
        if (!isMovingMouse.current) {
            uniforms.uMouseEffect.value *= .99
        }

        uniforms.uMousePosition.value[0] += (targetMousePosition.current[0] - uniforms.uMousePosition.value[0]) * .025
        uniforms.uMousePosition.value[2] += (targetMousePosition.current[2] - uniforms.uMousePosition.value[2]) * .025
        uniforms.uMousePosition.value[1] = 3

        if (counter.current % 2 === 0) {
            uniforms.uMousePosition.needsUpdate = true
            uniforms.uMouseEffect.needsUpdate = true
        }

        if (uniforms.uCut.value && counter.current % 10 === 0) {
            uniforms.uCut.needsUpdate = true
        }

        if (uniforms.uPlayerPosition.value && counter.current % 5 === 0) {
            uniforms.uPlayerPosition.needsUpdate = true
        }

        uniforms.uTime.value += .005
        uniforms.uTime.needsUpdate = true
        counter.current++
    })

    useEffect(() => {
        if (ref && model?.geometry) {  
            let i = 0
            let matrix = new Matrix4()
            let position = new Vector3()
            let scale = new Vector3(1, 1, 1).multiplyScalar(partScaler)
            let rotation = new Quaternion()
            let y = new Vector3(0, 1, 0)

            for (let x = 0; x < partCount; x += 1) {
                for (let z = 0; z <partCount; z += 1) {
                    rotation.setFromAxisAngle(y, random.float(-.5, 0))

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
    }, [ref, size, model?.geometry, partScaler, partSize, partCount]) 

    useEffect(() => {
        let raycaster = new Raycaster()
        let pointer = new Vector2()
        let tid
        let onMouseMove = e => {
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

            raycaster.setFromCamera(pointer, camera)
            let [intersection] = raycaster.intersectObject(planeRef.current, false)

            if (intersection) {
                targetMousePosition.current = [intersection.point.x, 4, intersection.point.z]
                uniforms.uMouseEffect.value = Math.min(uniforms.uMouseEffect.value + .01, 1)
                uniforms.uMouseEffect.needsUpdate = true
                isMovingMouse.current = true

                clearTimeout(tid)
                tid = setTimeout(() => {
                    isMovingMouse.current = false
                }, 150)
            }
        }

        window.addEventListener("mousemove", onMouseMove)

        return () => {
            window.removeEventListener("mousemove", onMouseMove)
        }
    }, [camera, uniforms])

    return (
        <>
            <instancedMesh
                position={[0, 0, 0]}
                ref={setRef}
                args={[model?.geometry, material, partCount * partCount]}
                castShadow={false}
            />

            <mesh
                position={[0, 0, 0]}
                receiveShadow
                ref={planeRef}
                rotation-x={-Math.PI / 2}
            >
                <meshLambertMaterial color="#888" />
                <planeBufferGeometry args={[1000, 1000, 1, 1]} />
            </mesh>
        </>
    )
}


/*


   let customDepthMaterial = (
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
    )

    */