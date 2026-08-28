import { setState, useStore } from "@data/store"

export default function Debug() {
    const state = useStore(i => i.state)
    const progress = useStore(i => i.player.progress)
    const active = useStore(i => i.player.active)

    return (
        <div className="text-white absolute z-50 top-4 w-45 left-4 overflow-hidden flex flex-col gap-1 pointer-events-auto">
            <div>
                State: {state.toUpperCase()}
            </div> <div>
                Progress: {(progress * 100).toFixed(1)}%
            </div>
            <div>
                <button
                    onClick={() => {
                        let player = useStore.getState().player

                        setState({
                            player: {
                                ...player,
                                active: !player.active
                            }
                        })
                    }}
                >
                    {active ? "Stop" : "Start"}
                </button>
            </div>
        </div>
    )
}
