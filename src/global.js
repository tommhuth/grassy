import { BoxBufferGeometry, MeshLambertMaterial } from "three"

export const lightGray = new MeshLambertMaterial({ color: "#777" })
export const white = new MeshLambertMaterial({ color: "#fff" })
export const box = new BoxBufferGeometry(1, 1, 1, 1, 1, 1)