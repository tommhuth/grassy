import { useEffect, useState } from "react"
import { setBladesActive, setCutHeight, useStore, setWorldSize, setGrassProperty, State, start } from "../data/store"
import { useModels } from "../utils/models"

export default function UI() {
    let bladesActive = useStore(i => i.player.bladesActive)
    let cutHeight = useStore(i => i.player.cutHeight)
    let completionGrade = useStore(i => i.player.completionGrade)
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesHealth = useStore(i => i.player.bladesHealth)
    let kills = useStore(i => i.player.kills)
    let world = useStore(i => i.world)
    let state = useStore(i => i.state)
    let intro = useStore(i => i.intro)
    let [controls, setControls] = useState(false)
    let isDead = engineHealth === 0
    let [, sphereCount] = useModels("sphere")

    useEffect(() => {
        let onClick = () => {
            start()
        }

        window.addEventListener("click", onClick)

        return () => {
            window.removeEventListener("click", onClick)
        }
    }, [])

    return (
        <>
            <a
                className="ui-gamer-over"
                style={{
                    display: isDead ? "block" : undefined,
                }}
                href="/"
                onClick={() => window.location.reload()}
            >
                You dead
            </a>
            <div
                className="ui-intro"
                style={{
                    opacity: intro ? 1 : 0,
                }}
            >
                <h1 className="title title--big">
                    Untitled space <br />  lawn mower game
                </h1>
            </div>
            <div
                className="ui-map-controls"
                style={{
                    bottom: intro || state === State.LOADING ? "-5em" : undefined,
                    display: isDead ? "none" : undefined,
                }}
            >
                <button onClick={() => setControls(i => !i)}>
                    <svg viewBox="0 0 700 600">
                        <g fill="currentColor">
                            <path d="m186.67 396.67c-6.1914 0-12.125 2.457-16.5 6.832s-6.8359 10.312-6.8359 16.5v70c0 8.3359 4.4492 16.039 11.668 20.207s16.113 4.168 23.332 0 11.668-11.871 11.668-20.207v-70c0-6.1875-2.457-12.125-6.8359-16.5-4.375-4.375-10.309-6.832-16.496-6.832z" />
                            <path d="m233.33 326.67h-23.332v-256.67c0-8.3359-4.4492-16.039-11.668-20.207s-16.113-4.168-23.332 0-11.668 11.871-11.668 20.207v256.67h-23.332c-8.3359 0-16.039 4.4453-20.207 11.664s-4.168 16.117 0 23.336 11.871 11.664 20.207 11.664h93.332c8.3359 0 16.039-4.4453 20.207-11.664 4.168-7.2188 4.168-16.117 0-23.336-4.168-7.2188-11.871-11.664-20.207-11.664z" />
                            <path d="m350 208.2c-6.1875 0-12.125 2.4609-16.5 6.8359s-6.832 10.312-6.832 16.5v258.46c0 8.3359 4.4453 16.039 11.664 20.207s16.117 4.168 23.336 0 11.664-11.871 11.664-20.207v-258.46c0-6.1875-2.457-12.125-6.832-16.5s-10.312-6.8359-16.5-6.8359z" />
                            <path d="m398.46 143.6h-25.133v-73.602c0-8.3359-4.4453-16.039-11.664-20.207s-16.117-4.168-23.336 0-11.664 11.871-11.664 20.207v73.602h-25.133c-8.3359 0-16.039 4.4453-20.207 11.664-4.168 7.2227-4.168 16.117 0 23.336s11.871 11.664 20.207 11.664h96.93c8.3359 0 16.039-4.4453 20.207-11.664s4.168-16.113 0-23.336c-4.168-7.2188-11.871-11.664-20.207-11.664z" />
                            <path d="m513.33 326.67c-6.1875 0-12.121 2.457-16.496 6.832-4.3789 4.375-6.8359 10.312-6.8359 16.5v140c0 8.3359 4.4492 16.039 11.668 20.207s16.113 4.168 23.332 0 11.668-11.871 11.668-20.207v-140c0-6.1875-2.4609-12.125-6.8359-16.5s-10.309-6.832-16.5-6.832z" />
                            <path d="m560 256.67h-23.332v-186.67c0-8.3359-4.4492-16.039-11.668-20.207s-16.113-4.168-23.332 0-11.668 11.871-11.668 20.207v186.67h-23.332c-8.3359 0-16.039 4.4453-20.207 11.664-4.168 7.2188-4.168 16.117 0 23.336 4.168 7.2188 11.871 11.664 20.207 11.664h93.332c8.3359 0 16.039-4.4453 20.207-11.664s4.168-16.117 0-23.336-11.871-11.664-20.207-11.664z" />
                        </g>
                    </svg>
                </button>

                <ul className="ui-map-controls__list" style={{ display: controls ? undefined : "none" }}>
                    <li className="ui-map-controls__control">
                        <input
                            value={world.size}
                            disabled={isDead}
                            type="range"
                            min="20"
                            max="80"
                            step="5"
                            onChange={(e) => setWorldSize(parseInt(e.target.value, 10))}
                        />
                        {world.size} &times; {world.size} m
                    </li>
                    <li className="ui-map-controls__control">
                        Tame
                        <input
                            value={world.grassWildness}
                            disabled={isDead}
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            onChange={(e) => setGrassProperty("grassWildness", parseFloat(e.target.value, 10))}
                        />
                        Wild
                    </li>
                    <li className="ui-map-controls__control">
                        <input
                            value={world.grassHeight}
                            disabled={isDead}
                            type="range"
                            min="0.75"
                            max="3"
                            step="0.05"
                            onChange={(e) => setGrassProperty("grassHeight", parseFloat(e.target.value))}
                        />
                        {world.grassHeight * 2.5} m high
                    </li>
                    <li className="ui-map-controls__control">
                        <input
                            value={world.difficultyLevel}
                            disabled={isDead}
                            type="range"
                            min="0"
                            max={sphereCount}
                            step="1"
                            onChange={(e) => setGrassProperty("difficultyLevel", parseFloat(e.target.value))}
                        />
                        {world.difficultyLevel} obstacles
                    </li>
                </ul>
            </div>
            <ul
                className="ui-player"
                style={{
                    transform: intro || state === State.LOADING ? "translateX(200%)" : undefined,
                    display: isDead ? "none" : undefined,
                }}
            >
                <li>
                    <div className="ui-player__label">
                        Progress
                    </div>
                    <div style={{ fontSize: 20 }}>
                        {(Number.isNaN(completionGrade) ? 0 : completionGrade).toFixed(1) + "%"}
                    </div>
                </li>
                <li>
                    <div className="ui-player__label">
                        Blades
                    </div>
                    <button
                        className="ui-player__value"
                        style={{
                            alignItems: "center",
                            display: "inline-flex ",
                            gap: ".5em",
                            textShadow: "0 0 .5em black"
                        }}
                        onClick={() => setBladesActive(!bladesActive)}
                        disabled={bladesHealth === 0 || isDead}
                    >
                        <span
                            style={{
                                width: ".5em",
                                height: ".5em",
                                display: "block",
                                borderRadius: "50%",
                                background: bladesActive ? "#00ff73" : "#e0005e",
                            }}
                        />
                        {bladesActive ? "Active" : "Disabled"}
                    </button>
                </li>
                <li style={{ display: "none" }}>
                    <label
                        htmlFor="cuth"
                        className="ui-player__label"
                    >
                        Cut length
                    </label>
                    <div
                        className="ui-player__value"
                        style={{
                            display: "flex",
                            gap: "1em",
                        }}
                    >
                        <input
                            id="cuth"
                            type="range"
                            value={cutHeight}
                            disabled={isDead}
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
                    <div className="ui-player__label">
                        Health
                    </div>
                    <div className="ui-player__value">
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
                    <div className="ui-player__label">
                        Roadkills
                    </div>
                    <div className="ui-player__value">
                        {kills}
                    </div>
                </li>
            </ul>
        </>
    )
}