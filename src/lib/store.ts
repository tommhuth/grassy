import { Tuple3 } from "@src/types/global"
import { AlienObstacle, RockObstacle } from "@src/types/obstacles"
import { Object3D, OrthographicCamera, WebGLRenderer } from "three"
import { OBB } from "three/examples/jsm/Addons.js"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { alienPaths, getNextAlien } from "./alien-paths"
import random from "@huth/random"

interface Store {
    state: string
    loading: boolean
    camera: OrthographicCamera | null
    gl: WebGLRenderer | null
    obstacles: (RockObstacle | AlienObstacle)[]
    player: {
        size: Tuple3
        obb: OBB
        mesh: Object3D | null
        progress: number
        active: boolean
        surveying: boolean
    }
}

const useStore = create(
    subscribeWithSelector<Store>(() => ({
        state: "hello",
        loading: true,
        camera: null,
        gl: null,
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
            {
                type: "alien",
                radius: 1,
                path: alienPaths[0],
                position: alienPaths[0].curve.points[0].toArray(),
                id: "1513312",
                direction: 1
            },
        ],
        player: {
            size: [2.35, 1, 1.35],
            mesh: null,
            obb: new OBB(),
            surveying: false,
            progress: 0,
            active: false
        }

    } satisfies Store))
)

export function setState(partial: Partial<Store>) {
    useStore.setState(partial)
}

export function removeAlien(id: string) {
    useStore.setState({
        obstacles: useStore.getState().obstacles.filter(i => i.id !== id)
    })
}

export function createAlien() {
    let a = getNextAlien()
    let d = random.pick(-1, 1)
    let p = a.curve.points[d === 0 ? 0 : a.curve.points.length - 1].toArray()

    useStore.setState({
        obstacles: [
            ...useStore.getState().obstacles,
            {
                type: "alien",
                radius: 1,
                path: a,
                position: p,
                id: random.id(),
                direction: d
            }
        ]
    })
}

export { useStore }