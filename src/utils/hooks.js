import { useEffect, useMemo } from "react" 
import Config from "../Config"
 
export function useKeys() {
    let keys = useMemo(() => {
        return {}
    }, [])

    useEffect(() => {
        let onKeyDown = ({ code }) => {
            keys[code] = true
        }
        let onKeyUp = ({ code }) => {
            delete keys[code]
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
    y = 0, 
}) {
    let canvas = useMemo(() => {
        let canvas = document.createElement("canvas")

        canvas.width = size
        canvas.height = size

        return canvas
    }, [size])

    useEffect(() => {
        if (Config.DEBUG) {
            document.body.appendChild(canvas)
            canvas.style.position = "fixed"
            canvas.style.top = y + "px"
            canvas.style.left = x + "px"
            canvas.style.zIndex = 99999990
            canvas.style.outline = "1px solid black"
            canvas.className = "cdebug"
        }
    }, [x, y, canvas])

    return canvas
}