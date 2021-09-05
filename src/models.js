import { createContext, useContext, useState } from "react"

const context = createContext()

export function useModels(type) {
    return useContext(context)[type]
}

export function ModelsProvider({ children }) {
    let [boxRef, setBoxRef] = useState()
    let [sphereRef, setSphereRef] = useState()

    return (
        <context.Provider value={{ box: boxRef, sphere: sphereRef }}>
            <instancedMesh
                ref={setBoxRef}
                args={[undefined, undefined, 50]}
            >
                <boxBufferGeometry args={[1, 1, 1, 1, 1, 1]} />
                <meshPhongMaterial   color="orange" />
            </instancedMesh>

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