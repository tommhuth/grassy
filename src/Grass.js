import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { DoubleSide, RGBADepthPacking } from "three"
import { useStore } from "./data/store"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"
import { useModel } from "./hooks"
import grassTransform from "./grassTransform.glsl"


export default function Grass({
    windScale = 2,
    height = 1.5,
    wildness = 1.5,
    scale = .05
}) {
    let counter = useRef(0)
    let cutTexture = useStore(i => i.world.cutTexture)
    let gapTexture = useStore(i => i.world.gapTexture)
    let cutHeight = useStore(i => i.player.cutHeight)
    let playerPositionTexture = useStore(i => i.world.playerPositionTexture)
    let worldSize = useStore(i => i.world.size)
    let grass = useModel({ name: "grass2" })// 135000  
    let uniforms = useMemo(() => {
        return {
            time: { value: 0, type: "f" },
            height: { value: height, type: "f" },
            windScale: { value: windScale, type: "f" },
            wildness: { value: wildness, type: "f" }, // subraction of base height
            scale: { value: scale, type: "f" }, // scale of noise of wildness
            cutHeight: { value: .15, type: "f" },
            cut: { value: null, type: "t" },
            gap: { value: null, type: "t" },
            playerPosition: { value: null, type: "t" }
        }
    }, [height, windScale, wildness, scale])

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

    useFrame(({ gl }) => {
        document.getElementById("debug").innerText = gl.info.render.calls
    })

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

    if (!grass) {
        return null
    }

    return (
        <>
            <mesh
                geometry={grass?.geometry}
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            //visible={false}
            >
                <meshDepthMaterial
                    attach="customDepthMaterial"
                    args={[{
                        depthPacking: RGBADepthPacking,
                        alphaTest: .5,
                        onBeforeCompile(shader) {
                            const chunk = `
                                #include <begin_vertex> 
 
                                transformed = grassTransform(position);
                            `

                            shader.uniforms = {
                                ...shader.uniforms,
                                ...uniforms
                            }

                            shader.vertexShader = ` 
                                uniform float time;
                                uniform float height;
                                uniform float cutHeight;
                                uniform sampler2D cut;
                                uniform sampler2D playerPosition;
                                uniform sampler2D gap; 
                                uniform float wildness;
                                uniform float scale;
                                uniform float windScale;
                                 
                                ${grassTransform}
                                ${shader.vertexShader}
                            `.replace("#include <begin_vertex>", chunk)
                        },
                    }]}
                />
                <shaderMaterial
                    attach="material"
                    side={DoubleSide}
                    transparent
                    args={[{
                        vertexShader,
                        fragmentShader,
                        uniforms,
                    }]}
                />
            </mesh>

            <mesh position={[0, -2.5, 0]} receiveShadow>
                <boxBufferGeometry args={[worldSize + 10, 5, worldSize + 10]} />
                <meshLambertMaterial color="darkgreen" />
            </mesh>
        </>
    )
}