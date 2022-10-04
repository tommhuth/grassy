import { BoxBufferGeometry, MeshLambertMaterial } from "three"

export const lightGray = new MeshLambertMaterial({ color: "#777", precision: "mediump" })
export const darkerGray = new MeshLambertMaterial({ color: "#555", precision: "mediump"  })
export const white = new MeshLambertMaterial({ color: "#fff", precision: "mediump"  })
export const box = new BoxBufferGeometry(1, 1, 1, 1, 1, 1)