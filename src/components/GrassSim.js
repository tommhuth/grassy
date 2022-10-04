import { useFrame } from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CanvasTexture } from "three"
import { setCompletionGrade, setupWorld, useStore } from "../data/store"
import { useCanvas } from "../utils/hooks"

export default function GrassSim({
    size = 128,
    completionFidelity = 48
}) {
    let tid = useRef()
    let [playerWidth, , playerDepth] = useStore(i => i.player.size)
    let [mapSize, setMapSize] = useState(0)
    let worldSize = useStore(i => i.world.size)
    let bladesActive = useStore(i => i.player.bladesActive)
    let bladesHealth = useStore(i => i.player.bladesHealth)
    let cutHeight = useStore(i => i.player.cutHeight)
    let roadkills = useStore(i => i.roadkills)
    let dangers = useStore(i => i.dangers)
    let obstacles = useStore(i => i.obstacles)
    let playerRotation = useRef(0)
    let playerPositionCanvas = useCanvas({ size, x: size * 2 + 20, y: 0 })
    let gapCanvas = useCanvas({ size, x: 0, y: 0 })
    let cutCanvas = useCanvas({ size, x: size + 10, y: 0 })
    let completionCanvas = useCanvas({ size: completionFidelity, x: size * 3 + 30, y: 0 })
    let cutTexture = useMemo(() => {
        let texture = new CanvasTexture(cutCanvas)

        return texture
    }, [cutCanvas])
    let gapTexture = useMemo(() => {
        let texture = new CanvasTexture(gapCanvas)

        return texture
    }, [gapCanvas])
    let playerPositionTexture = useMemo(() => {
        let texture = new CanvasTexture(playerPositionCanvas)

        return texture
    }, [playerPositionCanvas])
    let renderCut = useCallback(() => {
        let playerMesh = useStore.getState().player.mesh

        if (playerMesh) {
            let context = cutCanvas.getContext("2d", { alpha: false })

            let cutSize = (playerWidth / worldSize * size) * .95
            let x = (playerMesh.position.x + worldSize / 2) / worldSize * size
            let y = (playerMesh.position.z + worldSize / 2) / worldSize * size

            context.beginPath()
            context.fillStyle = "rgb(255, 0, 0)"
            context.arc(x, y, cutSize / 2, 0, Math.PI * 2)
            context.fill()
            cutTexture.needsUpdate = true
        }
    }, [cutCanvas, cutTexture, worldSize, playerWidth, size])
    let renderPositions = useCallback(() => {
        let playerMesh = useStore.getState().player.mesh
        let width = (playerWidth / worldSize * size) * .95
        let depth = (playerDepth / worldSize * size) * .95
        let context = playerPositionCanvas.getContext("2d", { alpha: false })
        let x = (playerMesh.position.x + worldSize / 2) / worldSize * size
        let y = (playerMesh.position.z + worldSize / 2) / worldSize * size

        context.fillStyle = "rgba(0, 0, 0, .05)"
        context.fillRect(0, 0, size, size)

        context.translate(x, y)
        context.rotate(-playerRotation.current + Math.PI / 2)
        context.translate(-x, -y)
        context.fillStyle = "rgb(255, 0, 0)"
        context.fillRect(x - width / 2, y - depth / 2, width, depth)
        context.resetTransform()
        context.beginPath()

        for (let roadkill of roadkills) {
            let x = (roadkill.position?.x + worldSize / 2) / worldSize * size
            let z = (roadkill.position?.z + worldSize / 2) / worldSize * size

            context.moveTo(x, z)
            context.arc(x, z, 2, 0, Math.PI * 2)
        }

        context.fill()

        playerPositionTexture.needsUpdate = true
    }, [playerPositionCanvas, roadkills, playerPositionTexture, worldSize, size, playerWidth, playerDepth])
    let renderGap = useCallback(() => {
        let context = gapCanvas.getContext("2d", { alpha: false })

        context.clearRect(0, 0, size, size)
        context.fillStyle = "rgb(255, 0, 0)"
        context.beginPath()

        for (let obstacle of obstacles) {
            let buffer = .2
            let x = (obstacle.position[0] + worldSize / 2) / worldSize * size
            let z = (obstacle.position[2] + worldSize / 2) / worldSize * size
            let width = ((obstacle.size[0] + buffer) / worldSize) * size
            let depth = ((obstacle.size[2] + buffer) / worldSize) * size

            context.resetTransform()
            context.translate(x, z)
            context.rotate(-obstacle.rotation)
            context.translate(-x, -z)
            context.rect(x - width / 2, z - depth / 2, width, depth)
        }

        context.resetTransform()

        for (let danger of dangers) {
            let buffer = .2
            let x = (danger.position[0] + worldSize / 2) / worldSize * size
            let z = (danger.position[2] + worldSize / 2) / worldSize * size
            let width = ((danger.radius + buffer) / worldSize) * size

            context.moveTo(x, z)
            context.arc(x, z, width, 0, Math.PI * 2)
        }

        context.fill()

        gapTexture.needsUpdate = true
    }, [gapCanvas, dangers, obstacles, gapTexture, worldSize, size])
    let getCompletionGrade = useCallback(() => {
        let filled = 0
        let context = completionCanvas.getContext("2d", { alpha: false })

        context.clearRect(0, 0, completionFidelity, completionFidelity)
        context.drawImage(cutCanvas, 0, 0, completionFidelity, completionFidelity)

        let image = context.getImageData(0, 0, completionFidelity, completionFidelity)

        for (let i = 0; i < image.data.length; i += 4) {
            if (image.data[i] > 10) {
                filled++
            }
        }

        return Math.min(filled / mapSize, 1) * 100
    }, [completionCanvas, cutCanvas, mapSize, completionFidelity])

    useEffect(() => {
        clearTimeout(tid.current)
        tid.current = setTimeout(() => {
            let context = completionCanvas.getContext("2d", { alpha: false })
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
        }, 750)

        return () => {
            clearTimeout(tid.current)
        }
    }, [obstacles, completionFidelity, gapCanvas, completionCanvas])

    useEffect(() => {
        setupWorld({ gapTexture, cutTexture, playerPositionTexture })
    }, [cutTexture, gapTexture, playerPositionTexture])

    useEffect(() => {
        let context = cutCanvas.getContext("2d")

        context.clearRect(0, 0, size, size)
        cutTexture.needsUpdate = true
        setCompletionGrade(0)
    }, [cutHeight, worldSize, cutCanvas, cutTexture, size])


    useEffect(() => {
        let updateCompletionGrade = () => {
            setCompletionGrade(getCompletionGrade())
        }

        if (bladesActive && mapSize > 0) {
            let id = setInterval(updateCompletionGrade, 3000)
            let onVisibilityChange = () => {
                if (document.hidden) {
                    clearInterval(id)
                } else {
                    setInterval(updateCompletionGrade, 3000)
                }
            }

            document.addEventListener("visibilitychange", onVisibilityChange)

            return () => {
                clearInterval(id)
                document.removeEventListener("visibilitychange", onVisibilityChange)
            }
        }

        updateCompletionGrade()

    }, [bladesActive, mapSize, getCompletionGrade])

    useEffect(() => {
        return useStore.subscribe(
            i => {
                playerRotation.current = i
            },
            s => s.input.rotation
        )
    }, [])

    useEffect(() => {
        renderGap()
    }, [renderGap])

    useFrame(({ clock }) => {
        let time = Math.round(clock.getElapsedTime() * 60)

        if (bladesActive && bladesHealth > 0 &&   time % 2 === 0) {
            renderCut()
        }

        if (time % 3 === 0 ) {
            renderPositions()
        }
    })

    return null
}