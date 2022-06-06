import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import {   useMemo, useState } from "react"
import { Matrix4, Quaternion, Vector3 } from "three"
import {  useStore } from "./data/store"

let _matrix = new Matrix4()
let _quat = new Quaternion()
let _position = new Vector3()
let _scale = new Vector3()
let _y = new Vector3(0, 1, 0)

export default function Debris() {
    let [instance, setInstance] = useState() 
    let debrisPosition = useStore(i => i.player.debrisPosition)
    let count = 30
    let bits = useMemo(() => {
        if (debrisPosition === null) {
            return []
        }

        return new Array(count).fill().map(() => {
            return {
                position: [
                    debrisPosition[0] + random.float(-1, 1),
                    random.float(0, 4),
                    debrisPosition[2] + random.float(-1, 1)
                ],
                gravity: random.float(-.1, .1),
                rotation: random.float(-Math.PI, Math.PI),
                speed: random.float(.01, .5),
                size: random.float(.2, .6)
            }
        })
    }, [debrisPosition, count]) 

    useFrame(() => { 
        for (let i = 0; i < bits.length; i++) {
            let bit = bits[i]

            bit.gravity -= .01
            bit.position[0] += Math.cos(bit.rotation) * bit.speed
            bit.position[1] += bit.gravity
            bit.position[2] -= Math.sin(bit.rotation) * bit.speed

            if (bit.position[1] <= bit.size / 2) {
                bit.position[1] = bit.size / 2
                bit.gravity *= -.45
                bit.speed *= .8
            } else {
                bit.speed *= .97
            }

            instance.setMatrixAt(i, _matrix.compose(
                _position.set(...bit.position),
                _quat.setFromAxisAngle(_y, bit.rotation),
                _scale.set(bit.size, bit.size, bit.size)
            ))

            instance.instanceMatrix.needsUpdate = true
        } 
    })

    return (
        <instancedMesh
            castShadow
            receiveShadow
            ref={setInstance}
            args={[undefined, undefined, count]}
        >
            <boxBufferGeometry attach="geometry" args={[1, 1, 1, 1, 1, 1]} />
            <meshLambertMaterial color="#FFF" />
        </instancedMesh>
    )
}