import { extend, useFrame } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { useEffect, useRef } from "react"
import config from "@data/config"
import type { BoxObstacle } from "@data/store"
import { setState, useStore } from "@data/store"
import useFramerateReady from "@src/hooks/use-framerate-ready"
import extensions from "./extensions"
import Camera from "./components/camera"
import Player from "@components/player"
import { Mesh } from "three"
import Grass from "@components/grass"
import Lights from "@components/lights"
import RockObstacle from "@components/rock-obstacle"

extend(extensions)

function BoxObstacle({ obb, size, position, rotation }: BoxObstacle) {
    let ref = useRef<Mesh>(null)

    useFrame(() => {
        if (!ref.current) {
            return
        }

        obb.center.set(0, 0, 0)
        obb.rotation.identity()
        obb.halfSize.set(size[0] / 2, size[1] / 2, size[2] / 2)
        obb.applyMatrix4(ref.current.matrixWorld)
    })

    return (
        <mesh position={position} rotation-y={rotation} ref={ref} castShadow receiveShadow>
            <boxGeometry args={[...size]} />
            <meshPhongMaterial />
        </mesh>
    )
}


export default function App() {
    const loading = useStore(i => i.loading)
    const obstacles = useStore(i => i.obstacles)

    useFramerateReady(() => setState({ loading: false }))

    useEffect(() => {
        const canvas = document.getElementById("canvas")

        if (!loading && canvas) {
            canvas.style.opacity = "1"
        }
    }, [loading])

    return (
        <>
            <color attach="background" args={["#333"]} />
            <Camera />

            <Player />
            <Grass />

            <Lights />


            {obstacles.map(i => {
                switch (i.type) {
                    case "box":
                        return <BoxObstacle key={i.id} {...i} />
                    case "rock":
                        return <RockObstacle key={i.id} {...i} />
                }
            })}

            {config.stats && <Perf position="top-right" deepAnalyze />}
        </>
    )
} 