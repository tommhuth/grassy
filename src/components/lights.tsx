import { useStore } from "@lib/store"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type RefObject } from "react"
import { CameraHelper, DirectionalLight } from "three"

// direction the light travels, relative to the player
const lightOffset = [-10, -7, -6] as const
// how often (in frames) the shadow camera is moved along with the player
const updateInterval = 10

export function ShadowCameraHelper({ light }: { light: RefObject<DirectionalLight | null> }) {
    const helper = useRef<CameraHelper>(null)
    const { scene } = useThree()

    useEffect(() => {
        if (!light.current) {
            return
        }

        let instance = new CameraHelper(light.current.shadow.camera)


        helper.current = instance
        scene.add(instance)

        return () => {
            scene.remove(instance)
            instance.dispose()
            helper.current = null
        }
    }, [scene, light])

    useFrame(() => helper.current?.update())

    return null
}

export default function Lights() {
    const light = useRef<DirectionalLight>(null)
    const counter = useRef(0)
    const { scene, viewport } = useThree()
    const mapSize = Math.ceil(512 * viewport.dpr)
    let size = Math.max(viewport.width, viewport.height)

    useEffect(() => {
        if (light.current) {
            scene.add(light.current.target)
        }
    }, [scene])

    useEffect(() => {
        if (!light.current) {
            return
        }

        light.current.shadow.camera.updateProjectionMatrix()
    }, [viewport.width, viewport.height])

    useFrame(() => {
        let { player } = useStore.getState()

        counter.current++

        if (!light.current || !player.mesh || counter.current % updateInterval !== 0) {
            return
        }

        light.current.position.copy(player.mesh.position)
        light.current.target.position.set(
            player.mesh.position.x + lightOffset[0],
            player.mesh.position.y + lightOffset[1],
            player.mesh.position.z + lightOffset[2]
        )
    })

    return (
        <>
            <hemisphereLight
                groundColor="#75e6ff"
                color="#4f809c"
                intensity={.6}
            />
            <directionalLight
                ref={light}
                color={"#ebfffc"}
                position={[0, 0, 0]}
                target-position={[...lightOffset]}
                intensity={1.5}
                castShadow
                shadow-radius={4}
                shadow-bias={-.005}
                shadow-mapSize={[mapSize, mapSize]}
                shadow-camera-right={size + 5}
                shadow-camera-left={-size - 5}
                shadow-camera-top={30}
                shadow-camera-bottom={-15}
                shadow-camera-near={-size - 10}
                shadow-camera-far={size + 5}
            />
        </>
    )
}
