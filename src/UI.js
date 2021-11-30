import { useEffect, useRef } from "react"
import { setBladesActive, setCutHeight, useStore } from "./data/store"


export default function UI() { 
    let bladesActive = useStore(i => i.player.bladesActive)
    let speed = useRef()
    let cutHeight = useStore(i => i.player.cutHeight) 
    let completionGrade = useStore(i => i.player.completionGrade)

    useEffect(() => {
        return useStore.subscribe(
            i => speed.current.innerText = i.toFixed(2),
            s => s.player.speed
        )
    }, [])

    return ( 
        <div
            style={{
                position: "absolute",
                top: 10,
                textAlign: "right",
                right: 10,
                zIndex: 1000000,
                textShadow: "0 0 .5em black"
            }}
        >
            completionGrade={(completionGrade).toFixed(1) + "%"} <br />

            <button onClick={() => setBladesActive(!bladesActive)}>
                blades={JSON.stringify(bladesActive)}
            </button> <br />

            cut=<input
                type="range"
                value={cutHeight}
                min={.05}
                max={.4}
                step={.05}
                onChange={(e) => setCutHeight(e.target.valueAsNumber)}
            /> {cutHeight.toFixed(2)}
        </div>
    )
}


