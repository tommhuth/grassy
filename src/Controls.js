import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import { clamp } from "three/src/math/MathUtils"
import { setBladesActive, setRotation, setSpeed, start, useStore } from "./data/store"
import { useKeys } from "./hooks"

// https://beej.us/blog/data/javascript-gamepad/
function setDeadzone(x, y, deadzone = 0.25) {
    let m = Math.sqrt(x * x + y * y)

    if (m < deadzone) { 
        return [0, 0]
    }

    let over = m - deadzone  // 0 -> 1 - deadzone
    let nover = over / (1 - deadzone)  // 0 -> 1

    let nx = x / m
    let ny = y / m

    return [nx * nover, ny * nover]
}

export default function Controls() {
    let rotation = useRef(0)
    let speed = useRef(0)
    let keys = useKeys()
    let crashCounter = useStore(i => i.player.crashCounter)
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesActive = useStore(i => i.player.bladesActive)
    let vehicle = useStore(i => i.vehicle)
    let [crashed, setCrashed] = useState(false)
    let [controllerId, setControllerId] = useState()
    let ignoreButton = useMemo(() => {
        return [false]
    }, [])

    useEffect(() => {
        let startX = 0
        let totalRotation = 0
        let deltaRotation = 0
        let onTouchStart = (e) => {
            if (controllerId) {
                return
            }
            keys.KeyW = true
            startX = e.touches[0].clientX
        }
        let onTouchMove = (e) => {
            if (controllerId) {
                return
            }
            let currentRotation = (e.touches[0].clientX - startX) / (window.innerWidth * .2) * .5

            rotation.current = currentRotation + totalRotation
            deltaRotation = currentRotation
        }
        let onTouchEnd = () => {
            if (controllerId) {
                return
            }
            keys.KeyW = false
            totalRotation += deltaRotation
        }
        let onGamepadConnected = (e) => {
            setControllerId(e.gamepad.index)
            start()
        }
        let onGamepadDisconnected = () => {
            setControllerId(null)
        } 

        window.addEventListener("gamepadconnected", onGamepadConnected)
        window.addEventListener("gamepaddisconnected", onGamepadDisconnected)
        window.addEventListener("touchstart", onTouchStart)
        window.addEventListener("touchmove", onTouchMove)
        window.addEventListener("touchend", onTouchEnd)
        window.addEventListener("keydown", start)

        return () => {
            window.removeEventListener("touchstart", onTouchStart)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", onTouchEnd)
            window.removeEventListener("gamepadconnected", onGamepadConnected)
            window.removeEventListener("gamepaddisconnected", onGamepadDisconnected)
            window.removeEventListener("keydown", start)
        }
    }, [controllerId, keys])

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
        let controller = navigator.getGamepads()[controllerId]
        let isDead = engineHealth === 0
        let turnScale = speed.current > 0 ? speed.current / vehicle.maxSpeed : Math.abs(speed.current / vehicle.minSpeed)

        if (!controller) {
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
        } else {
            let [x] = setDeadzone(controller.axes[2], controller.axes[3], .25)
 
            rotation.current += x * .02 * turnScale

            if (controller.buttons[6].value > 0) {
                speed.current -= controller.buttons[6].value * .0025
            } else if (controller.buttons[7].value > 0) {
                speed.current += controller.buttons[7].value * .001
            } else {
                speed.current *= .95
            }

            if (controller.buttons[0].pressed && !ignoreButton[0]) {
                if (bladesActive) {
                    setBladesActive(false)
                } else if (!bladesActive) {
                    setBladesActive(true)
                }

                ignoreButton[0] = true
            }

            if (!controller.buttons[0].pressed) {
                ignoreButton[0] = false
            }
        }

        speed.current = clamp(speed.current, vehicle.minSpeed, vehicle.maxSpeed) 
    }, [keys, controllerId, ignoreButton, bladesActive])

    useFrame(() => {
        setRotation(rotation.current)
        setSpeed(speed.current)
    })

    return null
}