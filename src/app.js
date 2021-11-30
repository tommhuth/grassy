import "../assets/styles/app.scss"

if (!window.OffscreenCanvas) {
    window.OffscreenCanvas = class OffscreenCanvas {
        constructor(width, height) {
            this.canvas = document.createElement("canvas")
            this.canvas.width = width
            this.canvas.height = height

            this.canvas.convertToBlob = () => {
                return new Promise(resolve => {
                    this.canvas.toBlob(resolve)
                })
            }

            return this.canvas
        }
    }
}

import ReactDOM from "react-dom"
import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { paths } from "./data/store"
import Player from "./Player"
import Camera from "./Camera"
import Obstacle from "./Obstacle"
import GrassSim from "./GrassSim"
import Danger from "./Danger"
import { BufferGeometry } from "three"
import { Only } from "./utils"
import Config from "./Config"
import Roadkills from "./Roadkills"
import Grass from "./Grass"
import Controls from "./Controls"
import UI from "./UI"

function App() {
    return (
        <>
            <UI />
            <Controls />

            <Canvas
                id="main"
                orthographic
                dpr={window.matchMedia("(min-width: 1000px)").matches ? .85 : [1, 1.5]}
                camera={{
                    zoom: window.matchMedia("(max-width: 800px)").matches ? 34 : 40,
                    near: 0,
                    far: 100
                }}
                linear
                shadows
                colorManagement
                gl={{
                    antialias: true,
                    depth: true,
                    stencil: false,
                    alpha: false
                }}
            >
                <color attach="background" args={["gray"]} />

                <Camera />
                <Grass />
                <Player />

                <GrassSim />
                <Roadkills />

                <Danger
                    position={[0, 0, 5]}
                    radius={.5}
                />

                <Danger
                    position={[-5, 0, 5]}
                    radius={1}
                />


                <Obstacle
                    size={[5, 2, 2]}
                    position={[10, 1, 10]}
                    rotation={.8}
                />

                <Only if={Config.DEBUG}>
                    {paths.map((i, index) => {
                        return (
                            <line position={[0, 1, 0]} key={index} geometry={new BufferGeometry().setFromPoints(i.getPoints(40))}>
                                <lineBasicMaterial color="yellow" />
                            </line>
                        )
                    })}
                </Only>

                <Lights />

            </Canvas>
        </>
    )
}

function Lights() {
    let ref = useRef()


    useFrame(() => {
    })

    return (
        <>
            <ambientLight intensity={.4} />
            <directionalLight
                ref={ref}
                color={0xffffff}
                position={[8, 14, 6]}
                intensity={.45}
                castShadow
                onUpdate={self => {
                    let size = 45

                    self.shadow.camera.right = size
                    self.shadow.camera.left = -size
                    self.shadow.camera.top = size
                    self.shadow.camera.bottom = -size
                    self.shadow.camera.near = -size
                    self.shadow.camera.far = size
                    self.shadow.mapSize.set(512, 512)
                    self.updateMatrixWorld()
                    self.shadow.needsUpdate = true
                }}
            />
        </>
    )
}




ReactDOM.render(<App />, document.getElementById("root"))



/*



                <meshDepthMaterial
                    attach="customDepthMaterial"
                    args={[{
                        depthPacking: RGBADepthPacking,
                        alphaTest: .5,
                        onBeforeCompile(shader) {
                            const chunk = `
                                #include <begin_vertex>

                                vec4 wp = modelMatrix * vec4( transformed, 1.0 );;

                                transformed = grassTransform(wp.xyz) ;
                            `

                            shader.uniforms = {
                                ...shader.uniforms,
                                ...uniforms
                            }

                            shader.vertexShader = `
                                uniform float time;
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
                */