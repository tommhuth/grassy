import { useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { useStore } from "./data/store"

export default function Lights() {
    let ref = useRef() 
    let worldSize = useStore(i => i.world.size)
    let {scene} = useThree()

    useEffect(()=> {
        scene.add(ref.current.target)
    }, [scene])

    return (
        <> 
            <hemisphereLight groundColor={0xa5c7b0} color={0xafe3d4} intensity={.5}  />
            <directionalLight
                ref={ref}
                color={0xffffff}
                position={[0,0,0]}
                target-position={[-8, -14, -6]}
                intensity={.25}
                castShadow 
                onUpdate={self => {   
                    let size = worldSize * .75

                    self.shadow.camera.right = size
                    self.shadow.camera.left = -size
                    self.shadow.camera.top = size
                    self.shadow.camera.bottom = -size
                    self.shadow.camera.near = -size
                    self.shadow.camera.far = size
                    self.shadow.mapSize.set(512, 512)
                    self.updateMatrixWorld()
                    self.shadow.needsUpdate = true
                }}
            />
        </>
    )
}