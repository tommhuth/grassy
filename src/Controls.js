import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { clamp } from "three/src/math/MathUtils"
import { setRotation, setSpeed, useStore } from "./data/store"
import { useKeys } from "./hooks"

export default function Controls() {
    let rotation = useRef(0)
    let speed = useRef(0)
    let keys = useKeys()
    let crashCounter = useStore(i => i.player.crashCounter)
    let engineHealth = useStore(i => i.player.engineHealth)
    let vehicle = useStore(i => i.vehicle)
    let [crashed, setCrashed] = useState(false)

    useEffect(() => {
        let startX = 0
        let totalRotation = 0
        let deltaRotation = 0
        let onTouchStart = (e) => {
            keys.KeyW = true
            startX = e.touches[0].clientX
        }
        let onTouchMove = (e) => {
            let currentRotation = (e.touches[0].clientX - startX) / (window.innerWidth * .2) * .5

            rotation.current = currentRotation + totalRotation
            deltaRotation = currentRotation
        }
        let onTouchEnd = () => {
            keys.KeyW = false
            totalRotation += deltaRotation
        }

        window.addEventListener("touchstart", onTouchStart)
        window.addEventListener("touchmove", onTouchMove)
        window.addEventListener("touchend", onTouchEnd)

        return () => {
            window.removeEventListener("touchstart", onTouchStart)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", onTouchEnd)
        }
    }, [keys])

    useEffect(() => {
        speed.current *= -.5
        setCrashed(true)
    }, [crashCounter])


    useEffect(() => {
        if (crashed) {
            let id = setTimeout(() => setCrashed(false), 250)

            return () => {
                clearTimeout(id)
            }
        }
    }, [crashed])

    useFrame(() => {
        let isDead = engineHealth === 0
        let turnScale = speed.current > 0 ? speed.current / vehicle.maxSpeed : Math.abs(speed.current / vehicle.minSpeed)

        if ((keys.KeyW || keys.ArrowUp) && !crashed && !isDead) {
            speed.current += .0025
        } else if ((keys.KeyS || keys.ArrowDown) && !crashed && !isDead) {
            speed.current -= .001
        } else {
            speed.current *= .95
        }

        if ((keys.KeyA || keys.ArrowLeft) && !crashed && !isDead) {
            rotation.current += .025 * turnScale
        } else if ((keys.KeyD || keys.ArrowRight) && !crashed && !isDead) {
            rotation.current -= .025 * turnScale
        }

        speed.current = clamp(speed.current, vehicle.minSpeed, vehicle.maxSpeed)
    }, [keys])

    useFrame(() => {
        setRotation(rotation.current)
        setSpeed(speed.current)
    })

    return null
}