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
    let vehicle = useStore(i => i.vehicle)
    let [crashed, setCrashed] = useState(false) 

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
    }, [keys])

    useFrame(() => {
        setRotation(rotation.current)
        setSpeed(speed.current)
    })

    return null
}