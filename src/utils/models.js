import { createContext, useContext, useState } from "react"

const context = createContext({ sphere: [null, null] })

export function useModels(type) {
    return useContext(context)[type]
}

export function ModelsProvider({ children }) {
    let [sphereInstance, setSphereInstance] = useState()
    let sphereCount = 15

    return (
        <context.Provider value={{ sphere: [sphereInstance, sphereCount] }}>
            <instancedMesh
                ref={setSphereInstance}
                args={[undefined, undefined, sphereCount]}
                position={[0, 0, 0]}
                receiveShadow
                castShadow
            >
                <sphereBufferGeometry args={[1, 12, 12]} />
                <meshLambertMaterial color="#FFF" />
            </instancedMesh>
            {children}
        </context.Provider>
    )
}