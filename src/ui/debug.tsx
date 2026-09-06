import { setState, useStore } from "@lib/store"

export default function Debug() {
    const state = useStore(i => i.state)
    const progress = useStore(i => i.player.progress)
    const active = useStore(i => i.player.active)
    const surveying = useStore(i => i.player.surveying)

    return (
        <div className="text-white absolute z-50 top-4 w-45 left-4 overflow-hidden flex flex-col gap-1 pointer-events-auto">
            <div>
                State: {state.toUpperCase()}
            </div> <div>
                Progress: {(progress * 100).toFixed(1)}%
            </div>
            <label className="flex gap-1">
                <input
                    type="checkbox"
                    checked={surveying}
                    onChange={e => {
                        setState({
                            player: {
                                ...useStore.getState().player,
                                surveying: e.currentTarget.checked
                            }
                        })
                    }}
                /> Surveying
            </label>
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
