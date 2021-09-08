import { useEffect, useMemo, useState } from "react"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

let loader = new GLTFLoader()

export function useModel(name) {
    let [model, setModel] = useState()

    useEffect(() => {
        loader.load(`/models/${name}.glb`, (res) => {
            let element = res.scene.children[0]

            setModel(element)
        }, undefined, console.error)
    }, [name])

    return model
}


export function useKeys() {
    let keys = useMemo(() => {
        return {}
    }, [])

    useEffect(() => {
        let onKeyDown = ({ key }) => {
            keys[key] = true
        }
        let onKeyUp = ({ key }) => {
            delete keys[key]
        }

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }
    }, [keys])

    return keys
}

export function useCanvas({
    size = 100,
    x = 0,
    y = 0
}) {
    let canvas = useMemo(() => {
        let canvas = document.createElement("canvas")

        canvas.height = size
        canvas.width = size

        return canvas
    }, [size])

    useEffect(() => {
        document.body.appendChild(canvas)
        canvas.style.position = "fixed"
        canvas.style.top = y + "px"
        canvas.style.left = x + "px"
        canvas.style.zIndex = 99999990
        canvas.style.outline = "1px solid black"
    }, [x, y, canvas])

    return canvas
}