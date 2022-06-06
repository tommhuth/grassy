import "../assets/styles/app.scss"

import { createRoot as r3fCreateRoot, extend } from "@react-three/fiber"
import { createRoot as domCreateRoot } from "react-dom/client"
import { paths, setState, State } from "./data/store"
import Player from "./Player"
import Camera from "./Camera"
import Obstacle from "./Obstacle"
import GrassSim from "./GrassSim"
import { BufferGeometry, PlaneBufferGeometry, CanvasTexture, MeshBasicMaterial, PlaneGeometry } from "three"
import { Only } from "./utils"
import Config from "./Config"
import Roadkills from "./Roadkills"
import Grass from "./Grass"
import Controls from "./Controls"
import UI from "./UI"
import Lights from "./Lights"
import { EffectComposer } from "@react-three/postprocessing"
import { Suspense, useEffect } from "react"
import Dangers from "./Dangers"
import { ModelsProvider } from "./models"
import Debris from "./Debris"

extend({
    PlaneBufferGeometry,
    PlaneGeometry,
    CanvasTexture,
    MeshBasicMaterial,
})

const canvasRoot = r3fCreateRoot(document.getElementById("canvas-root"))
const uiRoot = domCreateRoot(document.getElementById("ui-root"))

uiRoot.render(<UI />)

function Loader() {
    useEffect(() => {
        return () => {
            setState(State.READY)
            document.getElementById("ui-loading").style.setProperty("--offset", "-50%")
            document.getElementById("ui-loading").style.setProperty("--text-color", "rgba(255,255,255,0)")
        }
    }, [])

    return null
}

function App() {
    return (
        <Suspense fallback={<Loader />}>
            <ModelsProvider>
                <Debris />
                <Controls />
                <Camera />
                <Grass />
                <Player />

                <GrassSim />
                <Roadkills />
                <Dangers />

                <Obstacle
                    size={[5, 5, 5]}
                    position={[15, 1, 15]}
                    rotation={.35}
                />
                <Obstacle
                    size={[7, 8, 6]}
                    position={[-23, 1, 0]}
                    rotation={-2.2}
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
                <EffectComposer />
            </ModelsProvider>
        </Suspense>
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
        dpr: window.devicePixelRatio === 1 ? .7 : window.devicePixelRatio * .45,
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