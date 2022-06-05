import create from "zustand"
import random from "@huth/random"
import { Box3, Vector3, CatmullRomCurve3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"

const playerSize = [3, 1.5, 5]

export const paths = [
    new CatmullRomCurve3([
        new Vector3(-50, 0, -50),
        new Vector3(-10, 0, 0),
        new Vector3(9, 0, 8),
        new Vector3(50, 0, -12)
    ]),
    new CatmullRomCurve3([
        new Vector3(0, 0, -50),
        new Vector3(0, 0, 15),
        new Vector3(-50, 0, 30),
    ]),
    new CatmullRomCurve3([
        new Vector3(-50, 0, 0),
        new Vector3(-25, 0, 10),
        new Vector3(0, 0, -16),
        new Vector3(25, 0, 0),
        new Vector3(5, 0, 55),
    ])
]

export const State = {
    LOADING: "loading",
    READY: "ready",
    GAME_OVER: "game-over",
}

const store = create(() => ({
    state: State.LOADING,
    input: {
        speed: 0,
        rotation: 0
    },
    player: {
        position: [0, .75, 0],
        rotation: 0,
        speed: 0,
        completionGrade: 0,
        aabb: new Box3(),
        obb: new OBB(new Vector3(0, 0, 0), new Vector3(playerSize[0] / 2, playerSize[1] / 2, playerSize[2] / 2)),
        radius: 2,
        size: playerSize,
        cutHeight: .15,
        bladesActive: false,
        bladesHealth: 100,
        engineHealth: 100,
        inDanger: false,
        kills: 0,
        crashCounter: 0
    },
    vehicle: {
        power: .0002,
        friction: .85,
        lightness: .8,
        bladesPenalty: .4,
        maxSpeed: .1,
        minSpeed: -.05,
        turnStrength: .025,
    },
    world: {
        size: 50,
        difficultyLevel: 5,
        cutTexture: null,
        gapTexture: null,
        playerPositionTexture: null,
        grassWildness: 1.5,
        grassHeight: 1.5,
        grassNoiseScale: .05,
        grassWindScale: 3,
    },
    trauma: 0,
    traumaScale: .2,
    obstacles: [],
    dangers: [],
    roadkill: []
}))

export function setTrauma(value, scale = .2) {
    store.setState({
        trauma: value,
        traumaScale: scale
    })
}
export function reduceTrauma() {
    const trauma = store.getState().trauma

    if (trauma === 0) {
        return
    }

    store.setState({
        trauma: Math.max(trauma - .01, 0),
    })
}

export function setGrassProperty(key, value) {
    store.setState({
        world: {
            ...store.getState().world,
            [key]: value,
        }
    })
}

export function setState(value) {
    store.setState({
        state: value,
    })
}

export function setWorldSize(size) {
    store.setState({
        world: {
            ...store.getState().world,
            size
        }
    })
}

export function crash(amount) {
    const state = store.getState()

    store.setState({
        player: {
            ...state.player,
            crashCounter: state.player.crashCounter + 1,
            engineHealth: Math.max(state.player.engineHealth - amount, 0)
        }
    })
}

export function setInputMode(mode) {
    store.setState({
        input: {
            ...store.getState().input,
            mode
        }
    })
}

export function setSpeed(speed) {
    store.setState({
        input: {
            ...store.getState().input,
            speed
        }
    })
}

export function setRotation(rotation) {
    store.setState({
        input: {
            ...store.getState().input,
            rotation
        }
    })
}

export function setCutHeight(height) {
    store.setState({
        player: {
            ...store.getState().player,
            cutHeight: height
        }
    })
}

let i = 0

export function addRoadkill() {
    if (store.getState().roadkill.length) {
        return false
    }

    let speed = random.pick(-.00075, .00075)
    let speedScale = random.float(.5, 1.5)
    let path = random.pick(...paths)
    let startIndex = speed > 0 ? .0001 : .9999
    let position = path.getPointAt(startIndex, new Vector3())

    i = (i + 1) % paths.length

    store.setState({
        roadkill: [
            ...store.getState().roadkill,
            {
                id: random.id(),
                position,
                startIndex,
                path,
                speed: speedScale * speed
            }
        ]
    })
}

export function incrementRoadkills() {
    store.setState({
        player: {
            ...store.getState().player,
            kills: store.getState().player.kills + 1
        }
    })
}

export function removeRoadkill(id) {
    store.setState({
        roadkill: store.getState().roadkill.filter(i => i.id !== id),
    })
}

export function addDanger({ position, radius, aabb }) {
    let id = random.id()

    store.setState({
        dangers: [
            ...store.getState().dangers,
            {
                id,
                position,
                radius,
                aabb,
            }
        ]
    })

    return id
}

export function removeDanger(id) {
    store.setState({
        dangers: store.getState().dangers.filter(i => i.id !== id)
    })
}

export function setInDanger(inDanger) {
    store.setState({
        player: {
            ...store.getState().player,
            inDanger
        }
    })
}


export function setCompletionGrade(value) {
    store.setState({
        player: {
            ...store.getState().player,
            completionGrade: value
        }
    })
}

export function setupWorld({ cutTexture, gapTexture, playerPositionTexture }) {
    store.setState({
        world: {
            ...store.getState().world,
            cutTexture,
            gapTexture,
            playerPositionTexture
        }
    })
}

export function reduceEngineHealth(amount = 30) {
    store.setState({
        player: {
            ...store.getState().player,
            engineHealth: Math.max(store.getState().player.engineHealth - amount, 0)
        }
    })
}
export function reduceBladesHealth(amount = random.integer(2, 8)) {
    store.setState({
        player: {
            ...store.getState().player,
            bladesHealth: Math.max(store.getState().player.bladesHealth - amount, 0)
        }
    })
}

export function setBladesActive(state) {
    store.setState({
        player: {
            ...store.getState().player,
            bladesActive: state
        }
    })
}

export function setPlayerPosition(position) {
    store.setState({
        player: {
            ...store.getState().player,
            position
        }
    })
}


export function addObstalce({ position, obb, size, rotation = 0, aabb }) {
    store.setState({
        obstacles: [
            ...store.getState().obstacles,
            {
                id: random.id(),
                obb,
                aabb,
                size,
                position,
                rotation
            }
        ]
    })
}

export const useStore = store