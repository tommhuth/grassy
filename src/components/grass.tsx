import grassModel from "@assets/models/grass.glb"
import { setMatrixAt } from "@lib/utils"
import random from "@huth/random"
import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { InstancedMesh } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { grasscount, grassstep } from "./grasssim"
import GrassMaterial from "./grass-material"
import Ground from "./ground"
import { useStore } from "@lib/store"

export default function Grass() {
    const [instance, setInstance] = useState<InstancedMesh | null>(null)
    const { nodes } = useGLTF(grassModel)
    const materialRef = useRef<GrassMaterial>(null)

    useEffect(() => {
        if (!instance) {
            return
        }

        let offset = (grasscount - 1) * grassstep / 2

        for (let xi = 0; xi < grasscount; xi++) {
            for (let zi = 0; zi < grasscount; zi++) {
                setMatrixAt({
                    instance,
                    index: xi * grasscount + zi,
                    position: [xi * grassstep - offset, 0, zi * grassstep - offset],
                    rotation: [0, random.float(-.5, .5), 0],
                    scale: 1
                })
            }
        }
    }, [instance])

    useFrame((state, delta) => {
        if (!materialRef.current) {
            return
        }

        let { player } = useStore.getState()
        let { uniforms } = materialRef.current

        uniforms.uTime.value += delta
        uniforms.uSurveying.value = damp(uniforms.uSurveying.value, player.surveying ? 1 : 0, player.surveying ? 2.5 : 3, delta)
        materialRef.current.wireframe = player.surveying

        if (player.mesh) {
            uniforms.uPlayerPosition.value.copy(player.mesh.position)
        }
    })

    return (
        <>
            <instancedMesh
                ref={setInstance}
                args={[nodes.patch.geometry, undefined, grasscount * grasscount]}
            >
                <grassMaterial ref={materialRef} />
            </instancedMesh>
            <Ground />
        </>
    )
}

useGLTF.preload(grassModel)
