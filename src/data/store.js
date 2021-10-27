import create from "zustand"
import random from "@huth/random"
import { Box3, Vector3, CatmullRomCurve3 } from "three"
import { OBB } from "three/examples/jsm/math/OBB"

const playerSize = [3, 1.5, 5] 

export const paths = [
    new CatmullRomCurve3([
        new Vector3(-25, 0, -25),
        new Vector3(-10, 0, 13),
        new Vector3(9, 0, 8),
        new Vector3(25, 0, -12)
    ])
]
 
const store = create(() => ({
    player: {
        position: [0, .75, 0],
        rotation: 0,
        speed: 0, 
        completionGrade: 0,
        aabb: new Box3(),
        obb: new OBB(new Vector3(0, 0, 0), new Vector3(playerSize[0] / 2, playerSize[1]/ 2, playerSize[2] / 2)),
        radius: 2,
        size: playerSize,
        cutHeight: .15,
        bladesActive: false,
        bladesHealth: 100,
        engineHealth: 10000,
        inDanger: false,
        kills: 0
    },
    vehicle: {
        power: .0002,
        friction: .85,
        lightness: .8,
        bladesPenalty: .55,
        maxSpeed: .02,
        minSpeed: -.0075,
        turnStrength: .025,
    },
    world: {
        size: 60,
        cutTexture: null,
        gapTexture: null,
        playerPositionTexture: null
    },
    obstacles: [],
    dangers: [],
    roadkill: []
}))

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
    let path = paths[i]
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
                speed
            }
        ]
    })
}
export function removeRoadkill(id, kill = false) {
    store.setState({
        roadkill: store.getState().roadkill.filter(i => i.id !== id),
        player: {
            ...store.getState().player,
            kills: store.getState().player.kills + (kill ? 1 : 0)
        }
    })
}

export function addDanger({ position, radius, rotation, aabb }) {
    store.setState({
        dangers: [
            ...store.getState().dangers,
            {
                id: random.id(),
                position,
                radius,
                aabb,
                rotation
            }
        ]
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

export function setSpeed(speed) {
    store.setState({
        player: {
            ...store.getState().player,
            speed
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
export function reduceBladesHealth(amount = 10) {
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

export function setPlayerRotation(rotation) {
    store.setState({
        player: {
            ...store.getState().player,
            rotation
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