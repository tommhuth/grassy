import "../assets/styles/app.scss"

import ReactDOM from "react-dom"
import { Canvas } from "@react-three/fiber"

import { useEffect, useState, useCallback } from "react"
import { setBladesActive, useStore } from "./data/store"

import Player from "./Player"
import Camera from "./Camera"
import Obstacle from "./Obstacle"
import GrassSim from "./GrassSim"
import Grass from "./Grass"
import Danger from "./Danger"


function App() { 
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesActive = useStore(i => i.player.bladesActive)
    let speed = useStore(i => i.player.speed) 
    let bladesHealth = useStore(i => i.player.bladesHealth) 
    let completionGrade = useStore(i => i.player.completionGrade) 


    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    color: "black",
                    zIndex: 1000
                }}
            >
                completionGrade={(completionGrade).toFixed(1) + "%"} <br />
                engineHealth={engineHealth.toFixed(0) + "%"} <br />
                bladesHealth={bladesHealth.toFixed(0)}% <br />
                speed={speed.toFixed(3)} <br />
                blades={JSON.stringify(bladesActive)}  <br /> <br />
                <button onClick={() => setBladesActive(!bladesActive)}>Activate blades</button>
            </div>

            <Canvas
                id="main"
                orthographic
                dpr={1}
                //frameloop="demand"
                camera={{
                    zoom: 55,
                    near: 0,
                    far: 100
                }}
                linear
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

                <directionalLight
                    color={0xffffff}
                    position={[8, 14, 6]}
                    intensity={.9}
                    onUpdate={self => {
                        self.updateMatrixWorld()
                    }}
                />
                <ambientLight intensity={.25} />
                <pointLight position={[0, 10, 0]} distance={50} intensity={0} color="red" />

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


                <Player />



            </Canvas>
        </>
    )
}


/*

                {grass ? <primitive object={grass} position={[0, 0, 0]} >
                    <shaderMaterial
                        attach="material"
                        side={DoubleSide}
                        flatShading={false}
                        args={[{
                            vertexShader,
                            fragmentShader, //: ShaderLib.phong.fragmentShader,
                            uniforms,
                        }]}
                    />
                </primitive> : null}
  <canvas
                ref={setCanvas}
                width={500}
                height={500}
                style={{
                    position: "fixed",
                    display: "none",
                    top: 10,
                    zIndex: 10000,
                    outline: "1px solid red",
                    left: 10
                }}
            />
                    <meshLambertMaterial attachArray="material" color="darkgreen" />

                    <meshLambertMaterial attachArray="material"    >
                        <canvasTexture args={[canvas]} attach="map" ref={reff} />
                    </meshLambertMaterial>

                    <meshLambertMaterial attachArray="material" color="darkgreen" />
                    <meshLambertMaterial attachArray="material" color="darkgreen" />
                    <meshLambertMaterial attachArray="material" color="darkgreen" />


                */





ReactDOM.render(<App />, document.getElementById("root"))