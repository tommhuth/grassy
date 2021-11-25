import { createContext, useCallback, useEffect, useState } from "react"

export function easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2)
}

export function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num
} 

export function easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2
}

// https://gist.github.com/xposedbones/75ebaef3c10060a3ee3b246166caab56
export function map(val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
}

export function Only(props) {
    return props.if ? <>{props.children}</> : null
}

export function useResponsiveValue(defaultValue, breakpoints = {}) {
    let getValue = useCallback(() => {
        let resolved = defaultValue

        for (let [key, value] of Object.entries(breakpoints)) {
            if (window.matchMedia(`(max-width: ${key})`).matches) {
                resolved = value
            }
        }

        return resolved
    }, [defaultValue, breakpoints])
    let [responsiveValue, setResponsiveValue] = useState(() => getValue())

    useEffect(() => {
        let setValue = () => {
            setResponsiveValue(getValue())
        }
        let onResize = () => {
            clearTimeout(tid)
            tid = setTimeout(setValue, 150)
        }
        let tid

        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("resize", onResize)
        }
    }, [breakpoints, getValue])

    return responsiveValue
}

// Source: https://medium.com/@Heydon/managing-heading-levels-in-design-systems-18be9a746fa3
const Level = createContext(1)

export function Section({ children }) {
    return (
        <Level.Consumer>
            {level => <Level.Provider value={level + 1}>{children}</Level.Provider>}
        </Level.Consumer>
    )
}

export function Heading(props) {
    return (
        <Level.Consumer>
            {level => {
                let Component = `h${Math.min(level, 6)}`

                return <Component {...props} />
            }}
        </Level.Consumer>
    )
}

export function glsl(t) {
    for (var o = [t[0]], i = 1, l = arguments.length; i < l; i++) {
        o.push(arguments[i], t[i])
    }

    return o.join("")
} 
