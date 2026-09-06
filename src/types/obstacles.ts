import { CatmullRomCurve3 } from "three"
import { OBB } from "three/examples/jsm/Addons.js"
import { Tuple3 } from "@src/types/global"

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

export interface RoadkillObstacle extends Obstacle {
    type: "roadkill"
    radius: number
    path: CatmullRomCurve3
}
