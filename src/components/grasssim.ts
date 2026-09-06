import { setState, useStore } from "@lib/store"
import { CanvasTexture } from "three"
import Worker from "../worker?worker"
import { AnalyzeResultEvent } from "@src/worker"

const worker = new Worker()

setInterval(() => {
    let context1 = canvas.cut.getContext("2d", { willReadFrequently: false })
    let cutImage = context1?.getImageData(0, 0, textsize, textsize)
    let context = canvas.overlap.getContext("2d", { willReadFrequently: false })
    let overlapImage = context?.getImageData(0, 0, textsize, textsize)

    if (!cutImage || !overlapImage || !useStore.getState().player.active) return

    worker.postMessage(
        {
            type: "analyze",
            cutImage,
            overlapImage,
            mapSize: textsize * textsize
        },
        [overlapImage.data.buffer, cutImage.data.buffer]
    )
}, 1_000)

worker.addEventListener("message", (e: MessageEvent<AnalyzeResultEvent>) => {
    setState({
        player: {
            ...useStore.getState().player,
            progress: e.data.progress
        }
    })
})

export const canvas = {
    overlap: document.createElement("canvas"),
    cut: document.createElement("canvas"),
} as const

export const textsize = 512
export const worldsize = 40

// xz footprint of the patch in grass.glb (bbox is 5.97 x 5.86)
export const grassWildness = .975 // scale of noise height

export const grasspatchsize = 6
// patches step less than their footprint so the random per patch rotation cannot open a seam
export const grassstep = grasspatchsize * .85
// smallest grid that still covers worldsize: (n - 1) steps plus one whole patch
export const grasscount = Math.ceil((worldsize - grasspatchsize) / grassstep) + 1

function worldtotext(val: number) {
    return (val / worldsize) * textsize
}

function worldpostotextpos(val: number) {
    return ((val / (worldsize / 2)) + 1) / 2
}

for (let c of Object.values(canvas)) {
    c.width = textsize
    c.height = textsize

    const context = c.getContext("2d", { willReadFrequently: false })

    if (!context) {
        throw new Error("Missing context")
    }

    context.fillStyle = "#000"
    context.fillRect(0, 0, textsize, textsize)
}

export const cutTexture = new CanvasTexture(canvas.cut)
export const overlapTexture = new CanvasTexture(canvas.overlap)

// seconds for the trail to fade to ~37% (1/e); matches .075/frame @ 60fps
const FADE_TAU = 0.4
let lastRenderTime = performance.now()

function renderOverlap() {
    const { obstacles, player } = useStore.getState()
    const buffer = 5 //px
    const now = performance.now()
    const dt = Math.min((now - lastRenderTime) / 1000, 0.1)
    const alpha = 1 - Math.exp(-dt / FADE_TAU)
    const context = canvas.overlap.getContext("2d", { willReadFrequently: false })

    if (!context) {
        throw new Error("Missing context")
    }

    lastRenderTime = now

    context.resetTransform()
    context.fillStyle = `rgba(0, 0, 0, ${alpha})`
    context.fillRect(0, 0, canvas.overlap.width, canvas.overlap.height)
    context.beginPath()

    if (player.mesh) {
        const x = worldpostotextpos(player.mesh.position.x)
        const z = worldpostotextpos(player.mesh.position.z)
        const w = worldtotext(player.size[0]) + buffer
        const h = worldtotext(player.size[2]) + buffer

        context.resetTransform()
        context.translate(x * textsize, z * textsize)
        context.rotate(-player.mesh.rotation.y)
        context.roundRect(-w / 2, -h / 2, w, h, 5)
    }

    context.fillStyle = "#0F0"
    context.fill()
    context.beginPath()

    for (let obstacle of obstacles) {
        const x = worldpostotextpos(obstacle.position[0])
        const z = worldpostotextpos(obstacle.position[2])

        context.resetTransform()

        if (obstacle.type === "rock") {
            context.moveTo(x * textsize, z * textsize)
            context.arc(x * textsize, z * textsize, worldtotext(obstacle.radius) + buffer, 0, Math.PI * 2)
        } else if (obstacle.type === "box") {
            const w = worldtotext(obstacle.size[0]) + buffer
            const h = worldtotext(obstacle.size[2]) + buffer

            context.translate(x * textsize, z * textsize)
            context.rotate(-obstacle.rotation)
            context.roundRect(-w / 2, -h / 2, w, h, 5)
        }
    }

    context.fillStyle = "#f00"
    context.fill()

    overlapTexture.needsUpdate = true
    requestAnimationFrame(renderOverlap)
}

function renderCut() {
    const { player } = useStore.getState()
    const context = canvas.cut.getContext("2d", { willReadFrequently: false })

    if (context && player.mesh && player.active) {
        const x = worldpostotextpos(player.mesh.position.x) * textsize
        const z = worldpostotextpos(player.mesh.position.z) * textsize

        context.beginPath()
        context.arc(x, z, worldtotext(player.size[2]) / 2 + 2, 0, Math.PI * 2)
        context.fillStyle = "#FFF"
        context.fill()

        cutTexture.needsUpdate = true
    }

    requestAnimationFrame(renderCut)
}

renderOverlap()
renderCut()