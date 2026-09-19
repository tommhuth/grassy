import { Tuple3 } from "@src/types/global"
import { AlienObstacle, RockObstacle } from "@src/types/obstacles"
import { Object3D, OrthographicCamera, WebGLRenderer } from "three"
import { OBB } from "three/examples/jsm/Addons.js"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { alienPaths, getNextAlien } from "./alien-paths"
import random from "@huth/random"

export const State = {
    LOADING: "loading",
    READY: "ready",
    GAME_OVER: "game-over",
} as const

export type State = typeof State[keyof typeof State]

interface Store {
    state: State
    intro: boolean
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
        state: State.LOADING,
        intro: true,
        loading: true,
        camera: null,
        gl: null,
        obstacles: [
            {
                type: "rock",
                radius: 2,
                position: [0, 0, 5],
                rotation: 0,
                id: "1",
                variant: 1
            },
            {
                type: "rock",
                radius: .25,
                position: [-5, 0, 5],
                rotation: 1,
                id: "2",
                variant: 2
            },
            {
                type: "rock",
                radius: 3.25,
                position: [15, 0, -10],
                rotation: 1,
                id: "3",
                variant: 4
            },
            {
                type: "rock",
                radius: 2.5,
                position: [17, 0, 20],
                rotation: 1,
                id: "4",
                variant: 5
            },
            {
                type: "rock",
                radius: 1,
                position: [22, 0, 21],
                rotation: 1,
                id: "5",
                variant: 6
            },
            {
                type: "rock",
                radius: 1.25,
                position: [-15, 0, -10],
                rotation: 1,
                id: "6",
                variant: 7
            },
            {
                type: "alien",
                radius: 1,
                path: alienPaths[0],
                position: alienPaths[0].curve.points[0].toArray(),
                id: "7",
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

export function start() {
    let { intro, state } = useStore.getState()

    if (!intro || state !== State.READY) {
        return
    }

    useStore.setState({ intro: false })
}

export function setActive(active: boolean) {
    useStore.setState({
        player: {
            ...useStore.getState().player,
            active
        }
    })
}

export function removeAlien(id: string) {
    useStore.setState({
        obstacles: useStore.getState().obstacles.filter(i => i.id !== id)
    })
}

export function createAlien() {
    let path = getNextAlien()
    let direction: -1 | 1 = random.pick(-1, 1)
    let p = path.curve.points[direction === 1 ? 0 : path.curve.points.length - 1].toArray()

    useStore.setState({
        obstacles: [
            ...useStore.getState().obstacles,
            {
                type: "alien",
                radius: 1,
                path,
                position: p,
                id: random.id(),
                direction
            }
        ]
    })
}

export { useStore }