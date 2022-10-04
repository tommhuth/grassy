import { useEffect } from "react"
import { addRoadkill, useStore } from "../data/store"
import Roadkill from "./Roadkill"

export default function Roadkills() {
    let roadkills = useStore(i => i.roadkills)

    useEffect(() => {
        let spawnRoadkill = () => setInterval(addRoadkill, 18 * 1000)
        let iid = spawnRoadkill()
        let onVisibilityChange = () => { 
            if (document.hidden) {
                clearInterval(iid)
            } else {
                iid = spawnRoadkill()
            }
        }

        addRoadkill()

        window.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            clearInterval(iid)
            window.removeEventListener("visibilitychange", onVisibilityChange)
        }
    }, [])

    return roadkills.map(i => <Roadkill key={i.id} {...i} />)
} 