import { clamp } from "@data/utils"
import { useFrame } from "@react-three/fiber"
import { useMemo, useEffect } from "react"
import { damp } from "three/src/math/MathUtils.js"

const config = {
    acceleration: 4,
    turnSpeed: 3,
    maxSpeed: 6
} as const

interface Motion {
    speed: number
    targetRotation: number
    currentRotation: number
}

export function useControls() {
    const keys = useMemo<Record<string, boolean | number>>(() => ({}), [])
    const motion = useMemo<Motion>(() => ({
        speed: 0,
        targetRotation: 0,
        currentRotation: 0
    }), [])

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

    useEffect(() => {
        const pointerdown = (e: PointerEvent) => {
            if (e.pointerType !== "touch") {
                return
            }

        }
        const pointermove = (e: PointerEvent) => {
            if (e.pointerType !== "touch") {
                return
            }

        }
        const pointerup = (e: PointerEvent) => {
            if (e.pointerType !== "touch") {
                return
            }

        }

        window.addEventListener("pointerdown", pointerdown)
        window.addEventListener("pointermove", pointermove)
        window.addEventListener("pointerup", pointerup)

        return () => {
            window.removeEventListener("pointerdown", pointerdown)
            window.removeEventListener("pointermove", pointermove)
            window.removeEventListener("pointerup", pointerup)
        }
    }, [keys])

    useFrame((state, delta) => {
        const turning = Math.abs(clamp(motion.speed / 3, -1, 1))

        if (keys.keyw || keys.arrowup) {
            motion.speed += config.acceleration * delta
        } else if (keys.keys || keys.arrowdown) {
            motion.speed -= config.acceleration * delta
        } else {
            motion.speed = damp(motion.speed, 0, 2, delta)
        }

        if (keys.keya || keys.arrowleft) {
            motion.targetRotation += config.turnSpeed * delta * turning
        } else if (keys.keyd || keys.arrowright) {
            motion.targetRotation -= config.turnSpeed * delta * turning
        }

        motion.speed = clamp(motion.speed, -config.maxSpeed, config.maxSpeed)
        motion.currentRotation = damp(motion.currentRotation, motion.targetRotation, 6, delta)
    })

    return { keys, motion }
}
