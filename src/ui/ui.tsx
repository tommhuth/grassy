import { useEffect } from "react"
import config from "@lib/config"
import Debug from "./debug"
import Hud from "./hud"
import { start, State, useStore } from "@lib/store"

export default function Ui() {
    const intro = useStore(i => i.intro)
    const ready = useStore(i => i.state === State.READY)

    useEffect(() => {
        window.addEventListener("click", start)

        return () => window.removeEventListener("click", start)
    }, [])

    return (
        <>
            {ready && (
                <div
                    className="absolute left-[20%] top-1/2 z-100 -translate-y-1/2 pointer-events-none transition-all duration-400 animate-introin"
                    style={{ opacity: intro ? 1 : 0 }}
                >
                    <h1 className="text-[2.5em] max-[900px]:text-[2.5em] font-normal leading-[1.1] text-left mb-[.25em] max-[900px]:mb-[3em] [text-shadow:0_0_.5em_#000]">
                        Untitled space <br /> lawn mower game
                    </h1>
                </div>
            )}

            <Hud />

            {config.debug && <Debug />}
        </>
    )
}
