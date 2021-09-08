import create from "zustand"
import random from "@huth/random"
import { Box3 } from "three"

const store = create(() => ({
    player: {
        position: [0, .75, 0],
        rotation: 0,
        speed: 0,
        completionGrade: 0,
        aabb: new Box3(),
        radius: 2,
        size: [4, 5],
        bladesActive: false,
        bladesHealth: 100,
        engineHealth: 100,
        inDanger: false,
    },
    vehicle: { 
        power: .001,
        friction: .85,
        lightness: .8,
        bladesPenalty: .55,
        maxSpeed: .02,
        minSpeed: -.0075,
        turnStrength: .025,
     
    },
    world: {
        size: 50,
        cutTexture: null,
        gapTexture: null,
        playerPositionTexture: null
    },
    obstacles: [],
    dangers: []
}))

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