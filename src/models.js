import { createContext, useContext, useState } from "react"

const context = createContext()

export function useModels(type) {
    return useContext(context)[type]
}

export function ModelsProvider({ children }) {
    let [sphereRef, setSphereRef] = useState()

    return (
        <context.Provider value={{ sphere: sphereRef }}>
            <instancedMesh
                ref={setSphereRef}
                args={[undefined, undefined, 50]}
                position={[0,0,0]}
                receiveShadow
                castShadow
            >
                <sphereBufferGeometry args={[1, 14, 14]} />
                <meshPhongMaterial color="#FFF" />
            </instancedMesh>
            {children}
        </context.Provider>
    )
}