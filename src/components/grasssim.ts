import { setState, useStore } from "@lib/store"
import { CanvasTexture } from "three"
import Worker from "../worker?worker"
import { AnalyzeEvent, AnalyzeResultEvent } from "@src/worker"

const worker = new Worker()

worker.addEventListener("message", (e: MessageEvent<AnalyzeResultEvent>) => {
    excempt = e.data.excempt

    setState({
        player: {
            ...useStore.getState().player,
            progress: e.data.progress
        }
    })
})

const index = {
    overlap: 0,
    cut: 4
}

export const canvas = {
    overlap: document.createElement("canvas"),
    cut: document.createElement("canvas"),
} as const

export const textsize = 256 // expensive
export const worldsize = 40
export const grassWildness = .975 // scale of noise height 
// xz footprint of the patch in grass.glb (bbox is 5.97 x 5.86)
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

function getContext(c: HTMLCanvasElement) {
    const context = c.getContext("2d", { willReadFrequently: false })

    if (!context) {
        throw new Error("Missing context")
    }

    return context
}

for (let c of Object.values(canvas)) {
    c.width = textsize
    c.height = textsize

    const context = getContext(c)

    context.fillStyle = "#000"
    context.fillRect(0, 0, textsize, textsize)
}

const cutContext = getContext(canvas.cut)
const overlapContext = getContext(canvas.overlap)

// obstacles are static and only they write the red channel of the overlap map,
// so the exempt pixel count holds until the obstacle set changes
let excempt: number | null = null

useStore.subscribe(state => state.obstacles, () => excempt = null)

setInterval(() => {
    if (!useStore.getState().player.active) return

    const cutImage = cutContext.getImageData(0, 0, textsize, textsize)
    const overlapImage = excempt === null ? overlapContext.getImageData(0, 0, textsize, textsize) : null
    const transfer = [cutImage.data.buffer]

    if (overlapImage) {
        transfer.push(overlapImage.data.buffer)
    }

    worker.postMessage(
        {
            type: "analyze",
            cutImage,
            overlapImage,
            excempt,
            mapSize: textsize * textsize
        } satisfies AnalyzeEvent,
        transfer
    )
}, 2_000)

export const cutTexture = new CanvasTexture(canvas.cut)
export const overlapTexture = new CanvasTexture(canvas.overlap)

let lastRenderTime = performance.now()

function renderOverlap() {
    index.overlap++

    if (index.overlap % 3 !== 0) {
        return requestAnimationFrame(renderOverlap)
    }

    const { obstacles, player } = useStore.getState()
    const buffer = 3 //px
    const now = performance.now()
    const dt = Math.min((now - lastRenderTime) / 1000, 0.1)
    const alpha = 1 - Math.exp(-dt / 0.4)
    const context = overlapContext

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

    if (index.cut++ % 8 !== 0 || !player.mesh || !player.active) {
        return requestAnimationFrame(renderCut)
    }

    const x = worldpostotextpos(player.mesh.position.x) * textsize
    const z = worldpostotextpos(player.mesh.position.z) * textsize

    cutContext.beginPath()
    cutContext.arc(x, z, worldtotext(player.size[2]) / 2 + 2, 0, Math.PI * 2)
    cutContext.fillStyle = "#FFF"
    cutContext.fill()

    cutTexture.needsUpdate = true

    requestAnimationFrame(renderCut)
}

renderOverlap()
renderCut()