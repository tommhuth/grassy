export interface AnalyzeEvent {
    type: "analyze"
    cutImage: ImageData
    // only sent when the main thread has no cached count yet
    overlapImage: ImageData | null
    excempt: number | null
    mapSize: number
}

export interface AnalyzeResultEvent {
    type: "analyzeResult"
    excempt: number
    filled: number
    progress: number
}

self.addEventListener("message", ({ data }: MessageEvent<AnalyzeEvent>) => {
    switch (data.type) {
        case "analyze":
            return analyze(data.cutImage, data.overlapImage, data.excempt, data.mapSize)
    }
})

// red = ignore
function countExcempt(overlapImage: ImageData) {
    let excempt = 0

    for (let i = 0; i < overlapImage.data.length; i += 4) {
        if (overlapImage.data[i] > 10) {
            excempt++
        }
    }

    return excempt
}

function analyze(cutImage: ImageData, overlapImage: ImageData | null, cachedExcempt: number | null, mapSize: number) {
    let filled = 0

    for (let i = 0; i < cutImage.data.length; i += 4) {
        // white = cut
        if (cutImage.data[i] > 10) {
            filled++
        }
    }

    let excempt = cachedExcempt ?? (overlapImage ? countExcempt(overlapImage) : 0)

    let message: AnalyzeResultEvent = {
        type: "analyzeResult",
        excempt,
        filled,
        progress: Math.min(filled / (mapSize - excempt), 1)
    }

    self.postMessage(message)
}
