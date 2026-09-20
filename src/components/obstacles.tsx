import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import random from "@huth/random"
import AlienObstacle from "@components/alien-obstacle"
import RockObstacle from "@components/rock-obstacle"
import { createAlien, useStore } from "@lib/store"
import { ndelta } from "@lib/utils"

export default function Obstacles() {
    const obstacles = useStore(i => i.obstacles)
    const next = useRef(0)

    useFrame((state, delta) => {
        next.current -= ndelta(delta) * 1_000

        if (next.current <= 0) {
            next.current = random.integer(10_000, 18_000)
            createAlien()
        }
    })

    return obstacles.map(i => {
        switch (i.type) {
            case "rock":
                return <RockObstacle key={i.id} {...i} />
            case "alien":
                return <AlienObstacle key={i.id} {...i} />
        }
    })
}
