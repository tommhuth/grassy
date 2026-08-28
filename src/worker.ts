export interface AnalyzeEvent {
    type: "analyze"
    cutImage: ImageData
    overlapImage: ImageData
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
            return analyze(data.cutImage, data.overlapImage, data.mapSize)
    }
})

function analyze(cutImage: ImageData, overlapImage: ImageData, mapSize: number) {
    let filled = 0
    let excempt = 0

    for (let i = 0; i < cutImage.data.length; i += 4) {
        // white = cut
        if (cutImage.data[i] > 10) {
            filled++
        }

        // red = ignore
        if (overlapImage.data[i] > 10) {
            excempt++
        }
    }

    let message: AnalyzeResultEvent = {
        type: "analyzeResult",
        excempt,
        filled,
        progress: Math.min(filled / (mapSize - excempt), 1)
    }

    self.postMessage(message)
}