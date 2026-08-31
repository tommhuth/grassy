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
                type: "rock",
                radius: 2,
                position: [0, 0, 5],
                rotation: 0,
                id: "5",
                variant: 1
            },
            {
                type: "rock",
                radius: .25,
                position: [-5, 0, 5],
                rotation: 1,
                id: "52",
                variant: 2
            },
            {
                type: "rock",
                radius: 3.25,
                position: [15, 0, -10],
                rotation: 1,
                id: "152",
                variant: 4
            },
            {
                type: "rock",
                radius: 2.5,
                position: [17, 0, 20],
                rotation: 1,
                id: "1512",
                variant: 5
            },
            {
                type: "rock",
                radius: 1,
                position: [22, 0, 21],
                rotation: 1,
                id: "15s12",
                variant: 6
            },
            {
                type: "rock",
                radius: 1.25,
                position: [-15, 0, -10],
                rotation: 1,
                id: "15112",
                variant: 7
            },
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