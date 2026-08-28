import config from "@data/config"
import Debug from "./debug"

export default function Ui() {
    return (
        <>
            <div className="absolute z-10 left-[2em] bottom-[3em] text-white">
                R3F boilerplate
            </div>

            {config.debug && <Debug />}
        </>
    )
}