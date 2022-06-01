import { useEffect, useRef } from "react"
import { setBladesActive, setCutHeight, useStore, setWorldSize } from "./data/store"


export default function UI() {
    let bladesActive = useStore(i => i.player.bladesActive)
    let speed = useRef()
    let cutHeight = useStore(i => i.player.cutHeight)
    let completionGrade = useStore(i => i.player.completionGrade)
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesHealth = useStore(i => i.player.bladesHealth)
    let kills = useStore(i => i.player.kills)
    let world = useStore(i => i.world)

    useEffect(() => {
        return useStore.subscribe(
            i => speed.current.innerText = i.toFixed(2),
            s => s.player.speed
        )
    }, [])

    return (
        <>
            <ul
                style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1em",
                    bottom: "2em",
                    textAlign: "right",
                    left: "2em",
                    zIndex: 1000000,
                    textShadow: "0 0 .5em black"
                }}
            >
                <li>
                    <div
                        style={{
                            display: "flex",
                            gap: "1em", fontSize: 20
                        }}>
                        <input value={world.size} type="range" min="30" max="80" step="5" onChange={(e) => setWorldSize(parseInt(e.target.value, 10))} />
                        {world.size} &times; {world.size} m
                    </div>
                </li>
            </ul>
            <ul
                style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1em",
                    top: "2em",
                    textAlign: "right",
                    right: "2em",
                    zIndex: 1000000,
                    textShadow: "0 0 .5em black"
                }}
            >
                <li>
                    <div style={{ opacity: .7, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: ".25em" }}>
                        Progress
                    </div>
                    <div style={{ fontSize: 20 }}>
                        {(Number.isNaN(completionGrade) ? 0 : completionGrade).toFixed(1) + "%"}
                    </div>
                </li>
                <li>
                    <div style={{ opacity: .7, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: ".25em" }}>
                        Blades
                    </div>
                    <button
                        style={{ fontSize: 20, alignItems: "center", display: "inline-flex ", gap: ".5em", cursor: "pointer", textShadow: "0 0 .5em black" }}
                        onClick={() => setBladesActive(!bladesActive)}
                        disabled={bladesHealth === 0}
                    >
                        <span
                            style={{
                                width: ".5em",
                                height: ".5em",
                                display: "block",
                                borderRadius: "50%",
                                background: bladesActive ? "green" : "red",
                            }}
                        />
                        {bladesActive ? "Active" : "Disabled"}
                    </button>
                </li>
                <li>
                    <label
                        htmlFor="cuth"
                        style={{
                            display: "block",
                            textTransform: "uppercase",
                            marginBottom: ".25em",
                            letterSpacing: ".1em",
                            fontSize: 12,
                            opacity: .7
                        }}
                    >
                        Cut length
                    </label>
                    <div
                        style={{
                            display: "flex",
                            gap: "1em", fontSize: 20
                        }}
                    >
                        <input
                            id="cuth"
                            type="range"
                            value={cutHeight}
                            min={.05}
                            max={.3}
                            step={.05}
                            onChange={(e) => setCutHeight(e.target.valueAsNumber)}
                        />
                        <div>
                            {(cutHeight * 200 + 10).toFixed(0)} mm
                        </div>
                    </div>
                </li>
                <li>
                    <div style={{ opacity: .7, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: ".35em" }}>
                        Health
                    </div>
                    <div style={{ fontSize: 20 }}>
                        <span
                            style={{
                                opacity: .5,
                                borderRadius: 5,
                                marginRight: ".25em",
                                padding: "2px 5px",
                                outline: "1px dashed currentColor"
                            }}
                        >
                            {bladesHealth.toFixed(0) + "%"}
                        </span>
                        {engineHealth.toFixed(0) + "%"}
                    </div>
                </li>
                <li>
                    <div style={{ opacity: .7, letterSpacing: ".1em", fontSize: 12, textTransform: "uppercase", marginBottom: ".25em" }}>
                        Roadkills
                    </div>
                    <div style={{ fontSize: 20 }}>
                        {kills}
                    </div>
                </li>
            </ul>
        </>
    )
}