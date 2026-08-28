import { Tuple3 } from "@src/types/global"
import { CatmullRomCurve3, Object3D, Vector3 } from "three"
import { OBB } from "three/examples/jsm/Addons.js"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

interface Obstacle {
    id: string
    position: Tuple3
    rotation: number
}

export interface RockObstacle extends Obstacle {
    type: "rock"
    radius: number
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

interface Store {
    state: string
    loading: boolean
    obstacles: (RockObstacle | BoxObstacle | RoadkillObstacle)[]
    player: {
        size: Tuple3
        obb: OBB
        mesh: Object3D | null
        progress: number
        active: boolean
    }
}

const store = create(
    subscribeWithSelector<Store>(() => ({
        state: "hello",
        loading: true,
        obstacles: [
            {
                type: "box",
                obb: new OBB(new Vector3(10, 0, 10)),
                position: [10, 0, 10],
                size: [4, 4, 4],
                rotation: 1,
                id: "4"
            },
            {
                type: "rock",
                radius: 2,
                position: [0, 0, 5],
                rotation: 0,
                id: "5"
            },
            {
                type: "rock",
                radius: .25,
                position: [-5, 0, 5],
                rotation: 0,
                id: "52"
            }
        ],
        player: {
            size: [2.35, 1, 1.35],
            mesh: null,
            obb: new OBB(),
            progress: 0,
            active: false
        }

    } satisfies Store))
)
const useStore = store

export function setState(partial: Partial<Store>) {
    store.setState(partial)
}

export { store, useStore }