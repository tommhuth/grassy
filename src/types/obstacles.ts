import { CatmullRomCurve3 } from "three"
import { OBB } from "three/examples/jsm/Addons.js"
import { Tuple3 } from "@src/types/global"
import { alienPaths } from "@lib/alien-paths"

interface Obstacle {
    id: string
    position: Tuple3
    rotation: number
}

export interface RockObstacle extends Obstacle {
    type: "rock"
    radius: number
    variant: number
}

export interface BoxObstacle extends Obstacle {
    type: "box"
    obb: OBB
    size: Tuple3
}

export interface AlienObstacle extends Omit<Obstacle, "rotation"> {
    type: "alien"
    radius: number
    direction: 1 | -1
    path: typeof alienPaths[number]
}
