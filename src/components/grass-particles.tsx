import LoopCounter from "@lib/loop-counter"
import { useStore } from "@lib/store"
import { clamp, dampFactor, map, ndelta, setMatrixAt, setMatrixNullAt } from "@lib/utils"
import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { DoubleSide, InstancedMesh, PlaneGeometry, Vector3 } from "three"
import { worldsize } from "./grasssim"

const count = 200
const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI * .5)
const index = new LoopCounter(count)

interface Part {
    position: Vector3
    velocity: Vector3
    scale: number
    rotation: Vector3
    index: number
    damping: number
    resting: number
    active: boolean
}

const parts: Part[] = Array.from({ length: count }, (_, index): Part => ({
    position: new Vector3(),
    velocity: new Vector3(),
    rotation: new Vector3(),
    scale: 1,
    index,
    damping: 0,
    resting: 0,
    active: false
}))

const _delta = new Vector3()
const _params = {
    instance: null as unknown as InstancedMesh,
    index: 0,
    position: new Vector3(),
    rotation: new Vector3(),
    scale: 1
}

export default function GrassParticles() {
    const [instance, setRef] = useState<InstancedMesh | null>(null)
    const data = useMemo(() => {
        return {
            time: 0,
            next: 50,
            lastPosition: new Vector3()
        }
    }, [])

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
        let { player } = useStore.getState()
        let speed = 7

        if (!player.mesh || !player.active) {
            return
        }

        if (data.time > data.next) {
            const pos = player.mesh.position
            const vel = _delta.copy(pos)
                .sub(data.lastPosition)
                .length()
            const fadeDistance = 2.
            const size = worldsize / 2. - fadeDistance * .5
            const burst = Math.round(random.integer(2, 4) * clamp(vel / .1))
                * map(pos.x, size, size + fadeDistance, 1., 0.)
                * map(pos.x, -size - fadeDistance, -size, 0., 1.)
                * map(pos.z, size, size + fadeDistance, 1., 0.)
                * map(pos.z, -size - fadeDistance, -size, 0., 1.)

            data.lastPosition.copy(player.mesh.position)

            for (let i = 0; i < burst; i++) {
                let part = parts[index.next()]
                let rotation = random.float(0, Math.PI * 2)

                part.position.copy(player.mesh.position)
                part.velocity.set(
                    Math.cos(rotation) * speed,
                    random.float(-1.5, 1.5),
                    -Math.sin(rotation) * speed,
                )
                part.rotation.set(0, random.float(-Math.PI, Math.PI), 0)
                part.scale = random.float(.05, .2)
                part.damping = random.float(2.5, 6.5)
                part.resting = 0
                part.active = true
            }

            data.time = 0
            data.next = random.float(10, 40)
        }

        data.time += ndelta(delta) * 1_000
    })

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

            if (part.resting > 2_000) {
                part.active = false
                continue
            }

            part.position.addScaledVector(part.velocity, nd)
            part.velocity.multiplyScalar(dampFactor(part.damping, nd))

            part.rotation.x += part.velocity.x * nd * 5
            part.rotation.y += part.velocity.z * nd * 15
            part.rotation.z += part.velocity.z * nd * 8

            const speed = Math.abs(part.velocity.x)
                + Math.abs(part.velocity.z)
            const grounded = speed < .5 && part.position.y < .01

            if (grounded) {
                part.resting += nd * 1_000
                part.velocity.y = 0

                if (part.resting > 200) {
                    part.position.y -= .05 * nd
                } else {
                    part.position.y = .01
                }
            } else {
                part.velocity.y -= 5 * nd
            }

            _params.index = part.index
            _params.position = part.position
            _params.rotation = part.rotation
            _params.scale = part.scale

            setMatrixAt(_params)
        }
    })

    return (
        <instancedMesh
            ref={setRef}
            castShadow
            receiveShadow
            frustumCulled={false}
            args={[geometry, undefined, count]}
        >
            <meshLambertMaterial side={DoubleSide} color="rgb(50, 182, 100)" />
        </instancedMesh>
    )
}
