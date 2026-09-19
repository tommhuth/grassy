import { MeshLambertMaterial, MeshPhongMaterial } from "three"

export const lightGray = new MeshLambertMaterial({ color: "#777", precision: "mediump" })
export const darkerGray = new MeshLambertMaterial({ color: "#555", precision: "mediump" })
export const white = new MeshLambertMaterial({ color: "#fff", precision: "mediump" })
export const dark = new MeshPhongMaterial({ color: "#111", precision: "mediump" })

export const craftHull = darkerGray
export const craftCabin = white
export const craftWindows = dark
export const craftWings = white

export const alien = white

export const playerGlow = "#00fff7"
