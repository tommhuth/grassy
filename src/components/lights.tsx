import { useStore } from "@data/store"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { DirectionalLight } from "three"

// direction the light travels, relative to the player
const lightOffset = [-8, -14, -6] as const
// how often (in frames) the shadow camera is moved along with the player
const updateInterval = 10

export default function Lights() {
    const light = useRef<DirectionalLight>(null)
    const counter = useRef(0)
    const { scene, viewport } = useThree()

    useEffect(() => {
        if (light.current) {
            scene.add(light.current.target)
        }
    }, [scene])

    useFrame(() => {
        let { player } = useStore.getState()

        counter.current++

        if (!light.current || !player.mesh || counter.current % updateInterval !== 0) {
            return
        }

        // the shadow camera travels with the player, so the shadow map only ever
        // has to cover what's on screen
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
                groundColor={"#a5c7b0"}
                color={"#afe3d4"}
                intensity={.6}
            />
            <directionalLight
                ref={light}
                color={"#fff"}
                position={[0, 0, 0]}
                target-position={[...lightOffset]}
                intensity={1}
                castShadow
                shadow-radius={3}
                shadow-bias={-.005}
                onUpdate={self => {
                    // cover the visible diagonal, nothing more
                    let size = Math.sqrt(viewport.width ** 2 + viewport.height ** 2) / 2

                    self.shadow.camera.right = size
                    self.shadow.camera.left = -size
                    self.shadow.camera.top = size
                    self.shadow.camera.bottom = -size
                    self.shadow.camera.near = -size
                    self.shadow.camera.far = size
                    self.shadow.camera.updateProjectionMatrix()
                    self.shadow.mapSize.set(512, 512)
                    self.shadow.needsUpdate = true
                    self.updateMatrixWorld()
                }}
            />
        </>
    )
}
