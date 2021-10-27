import "../assets/styles/app.scss"

import ReactDOM from "react-dom"
import { Canvas, useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { addRoadkill, paths, setBladesActive, setCutHeight, useStore } from "./data/store"
import Player from "./Player"
import Camera from "./Camera"
import Obstacle from "./Obstacle"
import GrassSim from "./GrassSim"
import Grass from "./Grass"
import Danger from "./Danger"
import { BufferGeometry } from "three"
import Roadkill from "./Roadkill"
import { Only } from "./utils"
import Config from "./Config"

/*
window.oncontextmenu = (e) => {
    e.preventDefault()
}
*/

function UI() {
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesActive = useStore(i => i.player.bladesActive)
    let speed = useRef()
    let cutHeight = useStore(i => i.player.cutHeight)
    let bladesHealth = useStore(i => i.player.bladesHealth)
    let kills = useStore(i => i.player.kills)
    let completionGrade = useStore(i => i.player.completionGrade)

    useEffect(() => {
        return useStore.subscribe(
            i => speed.current.innerText = i.toFixed(3),
            s => s.player.speed
        )
    }, [])

    return (

        <div
            style={{
                position: "absolute",
                top: 10,
                textAlign: "right",
                right: 10,
                zIndex: 1000,
                textShadow: "0 0 .5em black"
            }}
        >
            completionGrade={(completionGrade).toFixed(1) + "%"} <br />
            engineHealth={engineHealth.toFixed(0) + "%"} <br />
            bladesHealth={bladesHealth.toFixed(0)}% <br />
            speed=<span ref={speed} >0.000</span><br />
            kills={kills}<br />

            <button onClick={() => setBladesActive(!bladesActive)}>blades={JSON.stringify(bladesActive)}</button> <br />

            cut=<input
                type="range"
                value={cutHeight}
                min={.05}
                max={.4}
                step={.05}
                onChange={(e) => setCutHeight(e.target.valueAsNumber)}
            /> {cutHeight.toFixed(2)}
        </div>
    )
}

function Roadkills() {
    let roadkill = useStore(i => i.roadkill)

    useEffect(() => {
        addRoadkill()

        setInterval(() => addRoadkill(), 1000 * 25)
    }, [])

    return roadkill.map(i => <Roadkill key={i.id} {...i} />)
}


function App() {

    return (
        <>
            <UI />
            <Canvas
                id="main"
                orthographic
                dpr={window.matchMedia("(min-width: 1000px)").matches ? .85 : [1, 2]}
                camera={{
                    zoom: window.matchMedia("(max-width: 800px)").matches ? 26 : 40,
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

                <Player />

                <GrassSim />
                <Grass />

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
                <Obstacle
                    size={[5, 5, 2]}
                    position={[10, 2.5, 0]}
                    rotation={0}
                />
                <Obstacle
                    size={[9, 10, 7]}
                    position={[-16, 5, -16]}
                    rotation={Math.PI / 2}
                />
                <Obstacle
                    size={[5, 2, 2]}
                    position={[0, 1, 16]}
                    rotation={-.12}
                />


                <Roadkills />

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
        ref.current.shadow.needsUpdate = true
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

                    self.shadow.camera.right = 40
                    self.shadow.camera.left = -40
                    self.shadow.camera.top = 40
                    self.shadow.camera.bottom = -40
                    self.shadow.camera.near = -40
                    self.shadow.camera.far = 40
                    self.shadow.mapSize.set(512, 512)
                    self.updateMatrixWorld()
                }}
            />
        </>
    )
}




ReactDOM.render(<App />, document.getElementById("root"))