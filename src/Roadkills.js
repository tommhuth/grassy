import random from "@huth/random"
import { useFrame } from "@react-three/fiber"
import { useEffect } from "react"
import { addRoadkill, useStore } from "./data/store"
import Roadkill from "./Roadkill"


export default function Roadkills() {
    let roadkill = useStore(i => i.roadkill)

    useEffect(() => {
        let tid
        let add = () => { 
            addRoadkill()

            tid = setTimeout(add, random.integer(1000 * 40, 1000 * 120))
        }
        
        add()

        return () => {
            clearTimeout(tid)
        }
    }, [])

    useFrame(({gl}) => {
        document.getElementById("debug").innerText = gl.info.render.calls
    })

    return roadkill.map(i => <Roadkill key={i.id} {...i} />)
} 