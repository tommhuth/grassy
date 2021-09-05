import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CanvasTexture } from "three"
import { setCompletionGrade, setupWorld, useStore } from "./data/store"

function useCanvas({
    size = 100,
    x = 0,
    y = 0
}) {
    let hasDebug = useRef(false)
    let canvas = useMemo(() => {
        let canvas = document.createElement("canvas")

        canvas.height = size
        canvas.width = size

        if (!hasDebug.current) {
            document.body.appendChild(canvas)
            canvas.style.position = "fixed"
            canvas.style.top = y + "px"
            canvas.style.left = x + "px"
            canvas.style.zIndex = 99999990
            canvas.style.outline = "1px solid black"
        }

        hasDebug.current = true

        return canvas
    }, [x, y, size])

    return canvas
}

export default function GrassSim({ size = 100, completionFidelity = 35 }) {
    let rafid = useRef()
    let rafid3 = useRef()
    let tid = useRef()
    let [playerWidth, playerDepth] = useStore(i => i.player.size)
    let [mapSize, setMapSize] = useState(0)
    let worldSize = useStore(i => i.world.size)
    let bladesActive = useStore(i => i.player.bladesActive)
    let dangers = useStore(i => i.dangers)
    let obstacles = useStore(i => i.obstacles)
    let previousPlayerPosition = useRef([0, 0, 0])
    let playerPosition = useRef([0, 0, 0])
    let playerRotation = useRef(0)
    let playerPositionCanvas = useCanvas({ size, x: size * 2 + 20, y: 0 })
    let gapCanvas = useCanvas({ size, x: 0, y: 0 })
    let cutCanvas = useCanvas({ size, x: size + 10, y: 0 })
    let completionCanvas = useCanvas({ size: completionFidelity, x: size * 3 + 30, y: 0 })
    let cutTexture = useMemo(() => new CanvasTexture(cutCanvas), [cutCanvas])
    let gapTexture = useMemo(() => new CanvasTexture(gapCanvas), [gapCanvas])
    let playerPositionTexture = useMemo(() => new CanvasTexture(playerPositionCanvas), [playerPositionCanvas])
    let renderCut = useCallback(() => {
        let dx = Math.abs(playerPosition.current[0] - previousPlayerPosition.current[0])
        let dy = Math.abs(playerPosition.current[2] - previousPlayerPosition.current[2])
        let delta = .035

        if ((dx > delta || dy > delta) && bladesActive) {
            let context = cutCanvas.getContext("2d")

            let cutSize = (playerWidth / worldSize * size) * .95
            let x = (playerPosition.current[0] + worldSize / 2) / worldSize * size
            let y = (playerPosition.current[2] + worldSize / 2) / worldSize * size

            context.beginPath()
            context.fillStyle = "rgb(255, 0, 0)"
            context.arc(x, y, cutSize / 2, 0, Math.PI * 2)
            context.fill()
            cutTexture.needsUpdate = true
        }

        previousPlayerPosition.current = playerPosition.current

        rafid.current = requestAnimationFrame(renderCut)
    }, [cutCanvas, cutTexture, worldSize, playerWidth, size, bladesActive])
    let renderPlayerPosition = useCallback(() => {
        let width = (playerWidth / worldSize * size) * .95
        let depth = (playerDepth / worldSize * size) * .95
        let context = playerPositionCanvas.getContext("2d")
        let x = (playerPosition.current[0] + 25) / worldSize * size
        let y = (playerPosition.current[2] + 25) / worldSize * size

        context.resetTransform()
        context.fillStyle = "rgba(0, 0, 0, .05)"
        context.fillRect(0, 0, size, size)

        context.fillStyle = "rgb(255, 0,0)"
        context.translate(x, y)
        context.rotate(-playerRotation.current)
        context.translate(-x, -y)
        context.fillRect(x - width / 2, y - depth / 2, width, depth)

        playerPositionTexture.needsUpdate = true

        rafid3.current = requestAnimationFrame(renderPlayerPosition)
    }, [playerPositionCanvas, playerPositionTexture, worldSize, size, playerWidth, playerDepth])
    let renderGap = useCallback(() => {
        let context = gapCanvas.getContext("2d")

        context.fillStyle = "rgb(255, 0, 0)"

        for (let obstacle of obstacles) {
            let buffer = .1
            let x = (obstacle.position[0] + worldSize / 2) / worldSize * size
            let z = (obstacle.position[2] + worldSize / 2) / worldSize * size
            let width = ((obstacle.size[0] + buffer) / worldSize) * size
            let depth = ((obstacle.size[2] + buffer) / worldSize) * size

            context.resetTransform()
            context.translate(x, z)
            context.rotate(-obstacle.rotation)
            context.translate(-x, -z)
            context.fillRect(x - width / 2, z - depth / 2, width, depth)
        }

        context.resetTransform()

        for (let danger of dangers) {
            let buffer = 0
            let x = (danger.position[0] + worldSize / 2) / worldSize * size
            let z = (danger.position[2] + worldSize / 2) / worldSize * size
            let width = ((danger.radius + buffer) / worldSize) * size

            context.arc(x, z, width, 0, Math.PI * 2)
            context.fill()
        }

        gapTexture.needsUpdate = true
    }, [gapCanvas, dangers, obstacles, gapTexture, worldSize, size])
    let getCompletionGrade = useCallback(() => {
        let filled = 0
        let context = completionCanvas.getContext("2d")

        context.clearRect(0, 0, completionFidelity, completionFidelity)
        context.drawImage(cutCanvas, 0, 0, completionFidelity, completionFidelity)

        let image = context.getImageData(0, 0, completionFidelity, completionFidelity)

        for (let i = 0; i < image.data.length; i += 4) {
            if (image.data[i] > 10) {
                filled++
            }
        } 
        
        return Math.min(filled / mapSize, 1)
    }, [completionCanvas, cutCanvas, mapSize, completionFidelity])

    useEffect(() => {
        clearTimeout(tid.current)
        tid.current = setTimeout(() => {
            let context = completionCanvas.getContext("2d")
            let exempt = 0

            context.clearRect(0, 0, completionFidelity, completionFidelity)
            context.drawImage(gapCanvas, 0, 0, completionFidelity, completionFidelity)

            let image = context.getImageData(0, 0, completionFidelity, completionFidelity)

            for (let i = 0; i < image.data.length; i += 4) {
                if (image.data[i] > 10) {
                    exempt++
                }
            }

            setMapSize((completionFidelity * completionFidelity) - exempt)
        }, 350)

        return () => {
            clearTimeout(tid.current)
        }
    }, [obstacles, completionFidelity, gapCanvas, completionCanvas])

    useEffect(() => {
        setupWorld({ gapTexture, cutTexture, playerPositionTexture })
    }, [cutTexture, gapTexture, playerPositionTexture])

    useEffect(() => {
        if (bladesActive && mapSize > 0) { 
            let id = setInterval(() => {
                setCompletionGrade(getCompletionGrade())
            }, 3000)

            return () => {
                clearInterval(id)
            }
        }
    }, [bladesActive, mapSize, getCompletionGrade])

    useEffect(() => {
        renderCut()

        return () => {
            cancelAnimationFrame(rafid.current)
        }
    }, [renderCut])

    useEffect(() => {
        renderPlayerPosition()

        return () => {
            cancelAnimationFrame(rafid3.current)
        }
    }, [renderPlayerPosition])

    useEffect(() => {
        renderGap()
    }, [renderGap])

    useEffect(() => {
        return useStore.subscribe(
            i => playerPosition.current = i,
            s => s.player.position
        )
    }, [])

    useEffect(() => {
        return useStore.subscribe(
            i => playerRotation.current = i,
            s => s.player.rotation
        )
    }, [])

    return null
}