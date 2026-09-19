import { BufferGeometry, CatmullRomCurve3, Vector3 } from "three"
import LoopCounter from "./loop-counter"
import { AlienObstacle } from "@src/types/obstacles"
import random from "@huth/random"

let paths = [
    [
        new Vector3(-31.4, 0.0, 45.8),
        new Vector3(0.5, 0.0, -22.5),
        new Vector3(18.0, 0.0, 10.0),
        new Vector3(42.2, 0.0, 14.1),
    ],
    [
        new Vector3(-40.7, 0.0, 14.8),
        new Vector3(-1.8, 0.0, -11.1),
        new Vector3(26.3, 0.0, -26.9),
        new Vector3(25.4, 0.0, 1.7),
        new Vector3(-0.6, 0.0, 20.3),
        new Vector3(-44.0, 0.0, -12.0),
    ],
    [
        new Vector3(34.6, 0.0, 36.7),
        new Vector3(-2.4, 0.0, 28.3),
        new Vector3(11.4, 0.0, 4.3),
        new Vector3(-1.4, 0.0, -19.3),
        new Vector3(-3.4, 0.0, -51.4),
    ],
    [
        new Vector3(41.8, 0.0, -42.1),
        new Vector3(3.5, 0.0, -10.2),
        new Vector3(14.2, 0.0, 6.3),
        new Vector3(-9.4, 0.0, 20.3),
        new Vector3(-49.0, 0.0, 31.3),
    ],
    [
        new Vector3(44.7, 0.0, -3.8),
        new Vector3(-2.7, 0.0, -22.0),
        new Vector3(-24.9, 0.0, -9.9),
        new Vector3(-9.4, 0.0, 25.5),
        new Vector3(1.6, 0.0, 59.2),
    ]
]

let index = new LoopCounter(paths.length - 1)

export const alienPaths = paths.map(points => {
    let curve = new CatmullRomCurve3(points, false, undefined, 0)
    let geometry = new BufferGeometry().setFromPoints(curve.getPoints(32))

    return {
        curve,
        geometry
    }
})

export function getNextAlien() {
    return alienPaths[index.next()]
}