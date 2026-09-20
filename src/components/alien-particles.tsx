import LoopCounter from "@lib/loop-counter"
import { dampFactor, ndelta, setMatrixAt, setMatrixNullAt } from "@lib/utils"
import { alien } from "@lib/materials"
import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { useEffect, useState } from "react"
import { BoxGeometry, InstancedMesh, Vector3 } from "three"
import type { Tuple2, Tuple3 } from "@src/types/global"

const count = 150
const geometry = new BoxGeometry(1, 1, 1)
const index = new LoopCounter(count)

const gravity = 36
const bounce = -.45
const groundDrag = .7
const restSpeed = .006
const restSpeedSquared = restSpeed ** 2
const restTime = 6_000
const deadTime = 8_000

interface Part {
    index: number
    position: Vector3
    velocity: Vector3
    rotation: number
    damp: number
    size: number
    time: number
    active: boolean
}

const parts: Part[] = Array.from({ length: count }, (_, index): Part => ({
    index,
    position: new Vector3(),
    velocity: new Vector3(),
    rotation: 0,
    damp: 0,
    size: 1,
    time: 0,
    active: false
}))

const _params = {
    instance: null as unknown as InstancedMesh,
    index: 0,
    position: new Vector3(),
    rotation: [0, 0, 0] as Tuple3,
    scale: 1
}

interface CreateAlienParticlesParams {
    position: Tuple3
    count?: number
    spread?: number
    height?: Tuple2
    gravity?: Tuple2
    speed?: Tuple2
    size?: Tuple2
}

export function createAlienParticles({
    position,
    count = random.integer(30, 45),
    spread = .6,
    height = [.5, 3],
    gravity: gravityRange = [-6, 6],
    speed: speedRange = [.5, 8],
    size = [.02, .2],
}: CreateAlienParticlesParams) {
    for (let i = 0; i < count; i++) {
        let part = parts[index.next()]
        let rotation = random.float(-Math.PI, Math.PI)
        let speed = random.float(...speedRange)

        part.position.set(
            position[0] + random.float(-spread / 2, spread / 2),
            position[1] + random.float(...height),
            position[2] + random.float(-spread / 2, spread / 2)
        )
        part.velocity.set(
            Math.cos(rotation) * speed,
            random.float(...gravityRange),
            -Math.sin(rotation) * speed
        )
        part.rotation = rotation
        part.damp = random.float(1.6, 2.1)
        part.size = random.float(...size)
        part.time = 0
        part.active = true
    }
}

export default function AlienParticles() {
    const [instance, setRef] = useState<InstancedMesh | null>(null)

    useEffect(() => {
        if (!instance) {
            return
        }

        for (let part of parts) {
            part.active = false
            setMatrixNullAt(instance, part.index)
        }
    }, [instance])

    useFrame((state, delta) => {
        if (!instance) {
            return
        }

        let nd = ndelta(delta)

        _params.instance = instance

        for (let i = 0; i < parts.length; i++) {
            let part = parts[i]

            if (!part.active) {
                continue
            }

            if (part.time > deadTime) {
                part.active = false
                continue
            }

            part.velocity.y -= gravity * nd
            part.position.x += part.velocity.x * nd
            part.position.z += part.velocity.z * nd

            if (part.position.y <= part.size / 2) {
                part.velocity.y *= bounce
                part.velocity.x *= groundDrag
                part.velocity.z *= groundDrag
            } else {
                let damp = dampFactor(part.damp, nd)

                part.velocity.x *= damp
                part.velocity.z *= damp
            }

            if (part.velocity.x ** 2 + part.velocity.z ** 2 > restSpeedSquared) {
                part.position.y = Math.max(part.position.y + part.velocity.y * nd, part.size / 2)
            } else {
                part.time += nd * 1_000

                if (part.time > restTime) {
                    part.position.y -= .25 * nd
                }
            }

            _params.index = part.index
            _params.position = part.position
            _params.rotation[1] = part.rotation
            _params.scale = part.size

            setMatrixAt(_params)
        }
    })

    return (
        <instancedMesh
            ref={setRef}
            castShadow
            receiveShadow
            frustumCulled={false}
            args={[geometry, alien, count]}
        />
    )
}
