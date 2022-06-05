import { useFrame, useThree } from "@react-three/fiber"
import { useLayoutEffect, useRef } from "react"
import { reduceTrauma, State, useStore } from "./data/store"


export default function Camera({ offset = [30, 30, -30], startPosition = [30, 30, -30] }) {
    let { camera } = useThree()
    let state = useStore(i => i.state)
    let target = useRef(startPosition)

    useLayoutEffect(() => {
        camera.position.set(...startPosition)
        camera.lookAt(startPosition[0] - offset[0], 0, startPosition[2] - offset[2])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, ...offset])

    useFrame(() => {
        let position = useStore.getState().player.position
        let trauma = useStore.getState().trauma ** 3 
        let traumaScale = useStore.getState().traumaScale  

        if (state === State.READY) {
            target.current[2] += (position[2] + offset[2] - target.current[2]) * .05
            target.current[0] += (position[0] + offset[0] - target.current[0]) * .05

            camera.position.x = target.current[0] + Math.random() * trauma * traumaScale
            camera.position.z = target.current[2] + Math.random() * trauma * traumaScale
            camera.position.y = target.current[1] + Math.random() * trauma * traumaScale
        }

        reduceTrauma()
    })

    return null
}