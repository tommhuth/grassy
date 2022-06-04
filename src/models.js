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
            >
                <sphereBufferGeometry args={[1, 16, 16]} />
                <meshPhongMaterial color="gray" />
            </instancedMesh>
            {children}
        </context.Provider>
    )
}