import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { DoubleSide, Matrix4, Vector3, MeshBasicMaterial, Quaternion, RGBADepthPacking } from "three"
import { useStore } from "./data/store"
import { useModel } from "./hooks"
import grassTransform from "./grassTransform.glsl"
import random from "@huth/random"
import { glsl } from "./utils"

export default function Grass({
    windScale = 3,
    height = 1.5,
    wildness = 1.5,
    scale = .05
}) {
    let [ref, setRef] = useState()
    let { viewport } = useThree()
    let size = useStore(i => i.world.size)
    let cutTexture = useStore(i => i.world.cutTexture)
    let gapTexture = useStore(i => i.world.gapTexture)
    let cutHeight = useStore(i => i.player.cutHeight)
    let playerPositionTexture = useStore(i => i.world.playerPositionTexture)
    let model = useModel({ name: "grass5" })
    let counter = useRef(0)
    let { material, uniforms } = useMemo(() => {
        let uniforms = {
            height: { value: height, type: "f" },
            randomizer: { value: Math.random(), type: "f" },
            canvasCross: { value: 0, type: "f" },
            cameraCenterPosition: { value: [0, 0, 0], type: "v3" },
            time: { value: 0, type: "f" },
            size: { value: size, type: "f" },
            windScale: { value: windScale, type: "f" },
            wildness: { value: wildness, type: "f" }, // subraction of base height
            scale: { value: scale, type: "f" }, // scale of noise of wildness
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
                    uniform float cutHeight;
                    uniform float canvasCross;
                    uniform float wildness;
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
                    flat in int vIgnore;  
                `)
                shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", glsl` 

                    if (vIgnore == 1) {
                        discard;
                    } 

                    vec3 top = vec3(255./255., 242./255., 133./255.);
                    vec3 bottom = vec3(0., 122./255., 100./255.); 
                    float height = 3.;

                    gl_FragColor = vec4(mix(bottom, top, vPosition.y/ height), clamp(vPosition.y / .25, 0., 1.));
                `)
            }
        })

        return { uniforms, material }
    }, [scale, wildness, height, size, windScale])


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
        uniforms.gap.value = gapTexture
    }, [uniforms, gapTexture])

    useEffect(() => {
        uniforms.playerPosition.value = playerPositionTexture
    }, [uniforms, playerPositionTexture])

    useFrame(() => {
        counter.current++

        if (uniforms.cut.value && counter.current % 2 === 0) {
            uniforms.cut.needsUpdate = true
        }

        if (uniforms.playerPosition.value && counter.current % 3 === 0) {
            uniforms.playerPosition.needsUpdate = true
        }

        uniforms.time.value += .005
        uniforms.time.needsUpdate = true
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


    if (!model) {
        return null
    }

    return (
        <>
            <instancedMesh
                position={[0, 0, 0]}
                ref={setRef}
                args={[model.geometry, material, size * size]}
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
                                uniform float wildness;
                                uniform float scale;
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

            <mesh position={[0, 0, 0]} receiveShadow rotation-x={-Math.PI / 2}>
                <meshLambertMaterial color="#888" />
                <planeBufferGeometry args={[200, 200, 1, 1]} />
            </mesh>
        </>
    )
}