import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useRef } from "react"
import { useStore } from "./data/store"


export default function Camera({ startPosition = [30, 30, -30] }) {
    let { camera } = useThree()
    let position = useRef(startPosition)

    useLayoutEffect(() => {
        camera.position.set(...position.current)
        camera.lookAt(0, 0, 0)
    }, [camera])

    useEffect(() => {
        return useStore.subscribe(
            i => position.current = i,
            state => state.player.position
        )
    }, [])

    useFrame(({ gl }) => {
        //document.getElementById("debug").innerText = gl.info.render.calls 

        camera.position.z += (position.current[2] + startPosition[2] - camera.position.z) * .1
        camera.position.x += (position.current[0] + startPosition[0] - camera.position.x) * .1
    })

    return null
}