import "../assets/styles/app.scss"

import { createRoot as r3fCreateRoot, extend } from "@react-three/fiber"
import { createRoot as domCreateRoot } from "react-dom/client"
import { paths } from "./data/store"
import Player from "./Player"
import Camera from "./Camera"
import Obstacle from "./Obstacle"
import GrassSim from "./GrassSim"
import Danger from "./Danger"
import { BufferGeometry, PlaneBufferGeometry, CanvasTexture, MeshBasicMaterial, PlaneGeometry } from "three"
import { Only } from "./utils"
import Config from "./Config"
import Roadkills from "./Roadkills"
import Grass from "./Grass"
import Controls from "./Controls"
import UI from "./UI"
import Lights from "./Lights"
import { EffectComposer } from "@react-three/postprocessing"
import { Suspense } from "react"

extend({
    PlaneBufferGeometry,
    PlaneGeometry,
    CanvasTexture,
    MeshBasicMaterial,
})

const canvasRoot = r3fCreateRoot(document.getElementById("canvas-root"))
const uiRoot = domCreateRoot(document.getElementById("ui-root"))

uiRoot.render(<UI />)

function App() {
    return (
        <>
            <Controls />
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
                radius={.4}
            />
            <Danger
                position={[-15, 0, 15]}
                radius={1.25}
            />
            <Danger
                position={[10, 0, -15]}
                radius={.85}
            />


            <Obstacle
                size={[5, 5, 5]}
                position={[15, 1, 15]}
                rotation={.35}
            />
            <Obstacle
                size={[7, 8, 6]}
                position={[-23, 1, 0]}
                rotation={-1}
            />

            <Only if={Config.DEBUG}>
                <axesHelper scale={10} position={[0, 4, 0]} />
                {paths.map((i, index) => {
                    return (
                        <line position={[0, 1, 0]} key={index} geometry={new BufferGeometry().setFromPoints(i.getPoints(40))}>
                            <lineBasicMaterial color="yellow" />
                        </line>
                    )
                })}
            </Only>

            <Lights />
            <Suspense fallback={null}>
                <EffectComposer />
            </Suspense>
        </>
    )
}

window.addEventListener("resize", () => {
    canvasRoot.configure({
        size: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        orthographic: true,
        linear: true,
        shadows: true,
        camera: {
            zoom: window.matchMedia("(max-width: 800px)").matches ? 34 : 40,
            near: -100,
            far: 500
        },
        dpr: window.matchMedia("(max-width: 1000px)").matches ? .85 : .75,
        gl: {
            antialias: false,
            depth: true,
            stencil: false,
            alpha: false
        }
    })

    canvasRoot.render(<App />)
})

window.dispatchEvent(new Event("resize"))