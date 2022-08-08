import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react" 
import { useStore } from "./data/store"

export default function Lights() {
    let ref = useRef()
    let counter = useRef(0) 
    let { scene, viewport } = useThree()

    useEffect(() => {
        scene.add(ref.current.target)  
    }, [scene])

    useFrame(() => {
        counter.current++

        if (counter.current % 30 === 0) {
            let position = useStore.getState().player.position

            ref.current.position.set(...position)
            ref.current.target.position.set(position[0] - 8, position[1] - 14, position[2] - 6)
        } 
    })

    return (
        <>
            <hemisphereLight groundColor={0xa5c7b0} color={0xafe3d4} intensity={.2} />
            <directionalLight
                ref={ref}
                color={0xffffff}
                position={[0, 0, 0]}
                target-position={[-8, -14, -6]}
                intensity={.35}
                castShadow
                onUpdate={self => {
                    // not sure if this makes sense
                    let size = Math.sqrt(viewport.width ** 2 + viewport.height ** 2) / 2 

                    size *= 1

                    self.shadow.camera.right = size
                    self.shadow.camera.left = -size
                    self.shadow.camera.top = size
                    self.shadow.camera.bottom = -size
                    self.shadow.camera.near = -size
                    self.shadow.camera.far = size
                    self.shadow.mapSize.set(256, 256)
                    self.updateMatrixWorld()
                    self.shadow.needsUpdate = true
                    self.shadow.bias = 0.001
                }}
            />
        </>
    )
}