import { setActive, useStore } from "@lib/store"

export default function Hud() {
    const intro = useStore(i => i.intro)
    const progress = useStore(i => i.player.progress)
    const active = useStore(i => i.player.active)

    return (
        <div
            className="absolute bottom-0 left-0 z-100 flex items-center gap-[1.5em] ml-[clamp(1rem,5vw,12rem)] mb-[clamp(3rem,5vh,12rem)] text-[clamp(1.1em,2.25vw,1.25em)] text-white"
            style={{
                display: intro ? "none" : undefined
            }}
        >
            <label>
                <span className="visually-hidden">Progress</span>
                <output>
                    {(progress * 100).toFixed(1)}%
                </output>
            </label>

            <button
                className="cursor-pointer border-[1em] border-solid border-transparent m-[-1em]"
                onClick={() => setActive(!active)}
            >
                {active ? "Deactivate" : "Activate"}
            </button>
        </div>
    )
}
