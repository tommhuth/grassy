import { setBladesActive, setCutHeight, useStore, setWorldSize, setGrassProperty, State } from "./data/store"


export default function UI() {
    let bladesActive = useStore(i => i.player.bladesActive)
    let cutHeight = useStore(i => i.player.cutHeight)
    let completionGrade = useStore(i => i.player.completionGrade)
    let engineHealth = useStore(i => i.player.engineHealth)
    let bladesHealth = useStore(i => i.player.bladesHealth)
    let kills = useStore(i => i.player.kills)
    let world = useStore(i => i.world)
    let state = useStore(i => i.state)
    let isDead = engineHealth === 0

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
                className="ui-map-controls"
                style={{
                    transform: state === State.LOADING ? "translateY(100%)" : undefined,
                    display: isDead ? "none" : undefined,
                }}
            >
                <h1 className="title">
                    Untitled space <br />  lawn mower game
                </h1>

                <ul className="ui-map-controls__list">
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
                            max="3"
                            step="0.1"
                            onChange={(e) => setGrassProperty("grassWildness", parseFloat(e.target.value, 10))}
                        />
                        Wild
                    </li>
                    <li className="ui-map-controls__control">
                        <input
                            value={world.grassHeight}
                            disabled={isDead}
                            type="range"
                            min="0.2"
                            max="2.5"
                            step="0.1"
                            onChange={(e) => setGrassProperty("grassHeight", parseFloat(e.target.value))}
                        />
                        {world.grassHeight} m high
                    </li>
                    <li className="ui-map-controls__control">
                        <input
                            value={world.difficultyLevel}
                            disabled={isDead}
                            type="range"
                            min="0"
                            max="50"
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
                    transform: state === State.LOADING ? "translateX(200%)" : undefined,
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
                <li>
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