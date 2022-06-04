import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useRef } from "react"
import { State, useStore } from "./data/store"


export default function Camera({ offset = [30, 30, -30], startPosition = [30, 30, -30] }) {
    let { camera } = useThree()
    let state = useStore(i => i.state)

    useLayoutEffect(() => {
        camera.position.set(...startPosition)
        camera.lookAt(startPosition[0]-offset[0], 0, startPosition[2]-offset[2])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, ...offset])

    useFrame(() => {
        if (state === State.READY) { 
            let position = useStore.getState().player.position

            camera.position.z += (position[2] + offset[2] - camera.position.z) * .05
            camera.position.x += (position[0] + offset[0] - camera.position.x) * .05
        }
    })

    return null
}