import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState, useRef } from "react"
import { DoubleSide } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { useStore } from "./data/store"
import vertexShader from "./vertex.glsl"
import fragmentShader from "./fragment.glsl"

let loader = new GLTFLoader()

function useModel(name) {
    let [model, setModel] = useState()

    useEffect(() => {
        loader.load(`/models/${name}.glb`, (res) => {
            let element = res.scene.children[0]

            setModel(element)
        }, undefined, console.error)
    }, [name])

    return model
}



export default function Grass({ height = 1 }) {
    let counter = useRef(0)
    let cutTexture = useStore(i => i.world.cutTexture)
    let gapTexture = useStore(i => i.world.gapTexture)
    let playerPositionTexture = useStore(i => i.world.playerPositionTexture)
    let worldSize = useStore(i => i.world.size)
    let grass = useModel("grass2")// 135000  
    let uniforms = useMemo(() => {
        return {
            time: { value: 0, type: "f" },
            height: { value: height, type: "f" },
            cut: { value: cutTexture, type: "t" },
            gap: { value: gapTexture, type: "t" },
            playerPosition: { value: playerPositionTexture, type: "t" }
        }
    }, [cutTexture, height, playerPositionTexture, gapTexture])

    useEffect(() => {
        uniforms.cut.value = cutTexture
    }, [uniforms, cutTexture])

    useEffect(() => {
        uniforms.gap.value = gapTexture
    }, [uniforms, gapTexture])

    useEffect(() => {
        uniforms.playerPosition.value = playerPositionTexture
    }, [uniforms, playerPositionTexture])

    useFrame(({ gl }) => {
        document.getElementById("debug").innerText = gl.info.render.calls
    })

    useFrame(()=> {
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
            <primitive
                object={grass}
                position={[0, 0, 0]}
            >
                <shaderMaterial
                    attach="material"
                    side={DoubleSide}
                    transparent
                    flatShading={false}
                    args={[{
                        vertexShader,
                        fragmentShader,
                        uniforms,
                    }]}
                />
            </primitive>

            <mesh position={[0, -2.5, 0]}>
                <boxBufferGeometry args={[worldSize + 2, 5, worldSize + 2]} />
                <meshLambertMaterial color="darkgreen" />
            </mesh>
        </>
    )
}