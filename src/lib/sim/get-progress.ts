import { TypedArray } from "three"
import { setState, useStore } from "../store"
import { textureSize } from "./const"

// counts the cut map: .r is the cut, .g the obstacles, so one read covers both
// the numerator and the denominator
export function getProgress(pixels: TypedArray) {
    const { player } = useStore.getState()
    let filled = 0
    let exempt = 0

    for (let i = 0; i < pixels.length; i += 4) {
        // a cut pixel under a rock must not land in the
        // numerator and be removed from the denominator at the same time
        if (pixels[i + 1] > 10) {
            exempt++
        } else if (pixels[i] > 10) {
            filled++
        }
    }

    setState({
        player: {
            ...player,
            progress: Math.min(filled / (textureSize * textureSize - exempt), 1)
        }
    })
}
