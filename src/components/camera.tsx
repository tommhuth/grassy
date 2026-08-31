import { useStore } from "@data/store"
import { map } from "@data/utils"
import { useFrame, useThree } from "@react-three/fiber"
import { BASE_ZOOM } from "@src/root"
import { useLayoutEffect } from "react"
import { damp } from "three/src/math/MathUtils.js"

export default function Camera() {
    const { camera } = useThree()

    useLayoutEffect(() => {
        camera.position.set(10, 10, -10)
        camera.lookAt(0, 0, 0)
    }, [camera])

    useFrame((state, delta) => {
        let { player } = useStore.getState()

        if (!player.mesh) {
            return
        }

        camera.position.x = damp(camera.position.x, player.mesh.position.x + 10, 3, delta)
        camera.position.z = damp(camera.position.z, player.mesh.position.z - 10, 3, delta)

        camera.zoom = map(state.viewport.width, 10, 15, BASE_ZOOM - 12, BASE_ZOOM)
        camera.updateProjectionMatrix()
    })

    return null
}