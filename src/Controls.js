import { useEffect, useMemo, useRef, useState } from "react"
import { clamp } from "three/src/math/MathUtils"
import { setRotation, setSpeed, useStore } from "./data/store"
import { useKeys } from "./hooks"

function useAnimationFrame(callback, deps = []) {
    const requestRef = useRef()
    const previousTimeRef = useRef()

    const animate = time => {
        if (previousTimeRef.current != undefined) {
            const deltaTime = time - previousTimeRef.current

            callback(deltaTime)
        }
        previousTimeRef.current = time
        requestRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(requestRef.current)
    }, deps)
}

// touch and controller controls are missing/incomplete
export default function Controls() {
    let rotation = useRef(0)
    let speed = useRef(0)
    let keys = useKeys()
    let crash = useStore(i => i.player.crash)
    let vehicle = useStore(i => i.vehicle)
    let [crashed, setCrashed] = useState(false)
    let mode = useRef("keyboard")
    let rtouch = useMemo(() => ({ start: 0, distance: 0, touching: false, count: 0 }), [])
    let stouch = useMemo(() => ({ start: 0, distance: 0, touching: false, count: 0 }), [])

    useEffect(() => {
        speed.current *= -.5
        setCrashed(true)
    }, [crash])

    useEffect(() => {
        if (crashed) {
            let id = setTimeout(() => setCrashed(false), 250)

            return () => {
                clearTimeout(id)
            }
        }
    }, [crashed])

    useAnimationFrame(() => {
        if (mode.current === "keyboard") {
            let turnScale = speed.current > 0 ? speed.current / vehicle.maxSpeed : Math.abs(speed.current / vehicle.minSpeed)

            if (keys.w && !crashed) {
                speed.current += .0025
            } else if (keys.s && !crashed) {
                speed.current -= .001
            } else {
                speed.current *= .95
            }

            if (keys.d && !crashed) {
                rotation.current -= .025 * turnScale
            } else if (keys.a && !crashed) {
                rotation.current += .025 * turnScale
            }

            speed.current = clamp(speed.current, vehicle.minSpeed, vehicle.maxSpeed)
        } else if (mode.current === "touch") {
            if (!stouch.touching) {
                speed.current = .1
            }

            if (!rtouch.touching) {
                //rotation.current *= .95
            }
        }
    }, [keys])

    useAnimationFrame(() => {
        setRotation(rotation.current)
        setSpeed(speed.current)
    })

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    zIndex: 1000,
                    top: "50%",
                    left: "0",
                    width: "50vw",
                    height: "100vh",
                    touchAction: "none",
                    transform: "translateY(-50%)"
                }}
                onTouchStart={(e) => {
                    mode.current = "touch"
                    rtouch.touching = true
                    rtouch.start = e.nativeEvent.targetTouches[0].clientX
                }}
                onTouchMove={(e) => {
                    let touch = e.nativeEvent.targetTouches[0]
                    let turnScale = speed.current > 0 ? speed.current / vehicle.maxSpeed : Math.abs(speed.current / vehicle.minSpeed)
                    let value = -(rtouch.start - touch.clientX) * .001

                    rotation.current += value * turnScale
                    rtouch.count++

                    if (rtouch.count % 3 === 0) {
                        rtouch.start = touch.clientX
                    }
                }}
                onTouchEnd={() => {
                    rtouch.touching = false
                    rtouch.count = 0
                }}
                onTouchCancel={() => {
                    rtouch.touching = false
                    rtouch.count = 0
                }}
            />
            <div
                style={{
                    position: "fixed",
                    zIndex: 1000,
                    top: "50%",
                    right: "0",
                    touchAction: "none",
                    width: "50vw",
                    height: "100vh",
                    transform: "translateY(-50%)"
                }}
                onTouchStart={(e) => {
                    mode.current = "touch"
                    stouch.touching = true
                    stouch.start = e.nativeEvent.targetTouches[0].clientY
                }}
                onTouchMove={(e) => {
                    let touch = e.nativeEvent.targetTouches[0]
                    let value = (stouch.start - touch.clientY) * .0005

                    speed.current += value
                    speed.current = clamp(speed.current, vehicle.minSpeed, vehicle.maxSpeed)
                    stouch.count++ 
                }}
                onTouchEnd={() => {
                    stouch.touching = false
                    stouch.count = 0
                }}
                onTouchCancel={() => {
                    stouch.touching = false
                    stouch.count = 0
                }}
            />
        </>
    )
}