import { useRef } from "react"

export default function Lights() {
    let ref = useRef() 

    return (
        <> 
            <hemisphereLight groundColor={0xa5c7b0} color={0xafe3d4} intensity={.6}  />
            <directionalLight
                ref={ref}
                color={0xffffff}
                position={[8, 14, 6]}
                intensity={.2}
                castShadow 
                onUpdate={self => {   
                    let size = 45

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