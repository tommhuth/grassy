import { setState, useStore } from "@lib/store"

export default function Debug() {
    const state = useStore(i => i.state)
    const camera = useStore(i => i.camera)
    const gl = useStore(i => i.gl)
    const progress = useStore(i => i.player.progress)
    const active = useStore(i => i.player.active)
    const surveying = useStore(i => i.player.surveying)
    let previousZoom = 1

    return (
        <div className="text-white absolute z-50 text-left top-4 w-45 left-4 overflow-hidden flex flex-col gap-1 pointer-events-auto">
            <div>
                State: {state.toUpperCase()}
            </div>
            <div>
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
            <button
                onPointerDown={() => {
                    if (!camera) return

                    previousZoom = camera.zoom
                    camera.zoom = 20
                    camera.updateProjectionMatrix()
                }}
                onPointerUp={() => {
                    if (!camera) return

                    camera.zoom = previousZoom
                    camera.updateProjectionMatrix()
                }}
            >
                Zoom out
            </button>
            <div>
                <button
                    onClick={() => {
                        gl?.forceContextLoss()
                        setTimeout(() => gl?.forceContextRestore(), 100)
                        // gl?.getContext().getExtension("WEBGL_lose_context")?.loseContext()
                    }}
                >
                    Lose context
                </button>
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
