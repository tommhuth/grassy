import { clamp } from "@data/utils"
import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useEffect } from "react"
import { damp } from "three/src/math/MathUtils.js"
import { Vector2, Vector3 } from "three"
import { useStore } from "@data/store"

const config = {
    acceleration: 2,
    turnSpeed: 2,
    turnDamp: 15,
    maxSpeed: 4,
    touchDistance: 120, // drag length for full speed
    touchDeadzone: 12,
} as const

interface Motion {
    speed: number
    targetRotation: number
    currentRotation: number
}

const _start = new Vector2()
const _current = new Vector2()
const _forward = new Vector3()
const _projected = new Vector3()

function useKeys() {
    const keys = useMemo<Record<string, boolean | number>>(() => ({}), [])

    useEffect(() => {
        const onkeydown = (e: KeyboardEvent) => {
            keys[e.code.toLowerCase()] = true
        }
        const onkeyup = (e: KeyboardEvent) => {
            keys[e.code.toLowerCase()] = false
        }

        window.addEventListener("keydown", onkeydown)
        window.addEventListener("keyup", onkeyup)

        return () => {
            window.removeEventListener("keydown", onkeydown)
            window.removeEventListener("keyup", onkeyup)
        }
    }, [keys])

    return keys
}

export function useControls() {
    const keys = useKeys()
    const motion = useMemo<Motion>(() => ({
        speed: 0,
        targetRotation: 0,
        currentRotation: 0
    }), [])
    const { camera } = useThree()

    useEffect(() => {
        const pointerdown = (e: PointerEvent) => {
            // anchor on the craft, not the finger, so the drag vector runs craft ->
            // finger and the thing points where you are actually pointing.
            //  taken once  otherwise closing the gap spins it again
            const mesh = useStore.getState().player.mesh

            if (e.pointerType !== "touch" || !mesh) {
                return
            }

            _projected.copy(mesh.position).project(camera)
            _start.set(
                (_projected.x * .5 + .5) * window.innerWidth,
                (-_projected.y * .5 + .5) * window.innerHeight
            )
            _current.set(e.clientX, e.clientY)
        }
        const pointermove = (e: PointerEvent) => {
            if (e.pointerType !== "touch") {
                return
            }

            keys.touch = true
            _current.set(e.clientX, e.clientY)
        }
        const pointerup = (e: PointerEvent) => {
            if (e.pointerType !== "touch") {
                return
            }

            keys.touch = false
        }

        window.addEventListener("pointerdown", pointerdown)
        window.addEventListener("pointermove", pointermove)
        window.addEventListener("pointerup", pointerup)
        window.addEventListener("pointercancel", pointerup)

        return () => {
            window.removeEventListener("pointerdown", pointerdown)
            window.removeEventListener("pointermove", pointermove)
            window.removeEventListener("pointerup", pointerup)
            window.removeEventListener("pointercancel", pointerup)
        }
    }, [keys, camera])

    useFrame((state, delta) => {
        const turning = Math.abs(clamp(motion.speed / 3, -1, 1))

        if (keys.keyw || keys.arrowup) {
            motion.speed += config.acceleration * delta
        } else if (keys.keys || keys.arrowdown) {
            motion.speed -= config.acceleration * delta
        } else if (keys.touch) {
            const dragX = _current.x - _start.x
            const dragY = _current.y - _start.y
            const length = Math.hypot(dragX, dragY)

            if (length > config.touchDeadzone) {
                camera.getWorldDirection(_forward)

                // looking down at the ground squashes it vertically on screen by
                // sin(pitch), so stretch the drag back out before taking its angle or
                // everything between the axes lands short. y flipped, clientY grows down
                const sinPitch = Math.max(Math.abs(_forward.y), .001)
                const dragAngle = Math.atan2(-dragY / sinPitch, dragX)

                // the rest is the camera's yaw, less the 90 deg between screen right
                // and screen up
                const cameraAngle = Math.atan2(-_forward.z, _forward.x)

                motion.targetRotation = dragAngle + cameraAngle - Math.PI / 2
            }

            const throttle = clamp((length - config.touchDeadzone) / config.touchDistance, 0, 1)

            motion.speed += config.acceleration * throttle * delta
        } else {
            motion.speed = damp(motion.speed, 0, 2, delta)
        }

        if (keys.keya || keys.arrowleft) {
            motion.targetRotation += config.turnSpeed * delta * turning
        } else if (keys.keyd || keys.arrowright) {
            motion.targetRotation -= config.turnSpeed * delta * turning
        }

        const currentRotation = motion.currentRotation
        const gap = motion.targetRotation - currentRotation
        // shortest path, keep dir
        const shortest = Math.atan2(Math.sin(gap), Math.cos(gap))

        // damp for the ease-in near the target, then cap the step to turnSpeed
        const step = damp(currentRotation, currentRotation + shortest, config.turnDamp, delta) - currentRotation
        const maxStep = config.turnSpeed * delta * turning

        motion.currentRotation += clamp(step, -maxStep, maxStep)
        motion.speed = clamp(motion.speed, -config.maxSpeed, config.maxSpeed)
    })

    return { keys, motion }
}
