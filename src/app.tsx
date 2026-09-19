import { extend, useFrame, useThree } from "@react-three/fiber"
import { Perf } from "r3f-perf"
import { useEffect, useLayoutEffect } from "react"
import config from "@lib/config"
import { createAlien, setState, useStore } from "@lib/store"
import useFramerateReady from "@src/hooks/use-framerate-ready"
import extensions from "./extensions"
import Camera from "./components/camera"
import Player from "@components/player"
import { WebGLRenderer } from "three"
import Grass from "@components/grass"
import Lights from "@components/lights"
import RockObstacle from "@components/rock-obstacle"
import AlienObstacle from "@components/alien-obstacle"
import { step } from "@lib/sim/step"

extend(extensions)

function Obstacles() {
    const obstacles = useStore(i => i.obstacles)

    useEffect(() => {
        let id = setInterval(createAlien, 14_000 * .25)

        createAlien()

        return () => clearInterval(id)
    }, [])


    return obstacles.map(i => {
        switch (i.type) {
            case "rock":
                return <RockObstacle key={i.id} {...i} />
            case "alien":
                return <AlienObstacle key={i.id} {...i} />
        }
    })
}


export default function App() {
    const loading = useStore(i => i.loading)
    const renderer = useThree(i => i.renderer)

    useLayoutEffect(() => {
        setState({ gl: renderer as WebGLRenderer })
    }, [renderer])

    useFramerateReady(() => setState({ loading: false }))

    useEffect(() => {
        const canvas = document.getElementById("canvas")

        if (!loading && canvas) {
            canvas.style.opacity = "1"
        }
    }, [loading])

    useFrame((state, delta) => {
        step(state.renderer as WebGLRenderer, state.scene, delta)
    })

    return (
        <>
            <Camera />

            <Player />
            <Obstacles />
            <Grass />

            <Lights />

            {config.stats && <Perf position="top-right" deepAnalyze />}
        </>
    )
}

/*


            {config.debug && alienPaths.map((i, index) => (
                <lineSegments
                    key={index}
                    position-y={.1}
                    geometry={i.geometry}
                >
                    <lineBasicMaterial color="red" />
                </lineSegments>
            ))}
            */
