import { MeshLambertMaterial } from "three"

// alien

// head shell, hands
export const alienGlow = new MeshLambertMaterial({
    color: "#78f1ca",
    emissive: "#78f1ca",
    emissiveIntensity: .25,
    toneMapped: false,
})

// visor, upper torso, shoulders, feet
export const alienTrim = new MeshLambertMaterial({
    color: "#edf0f5",
    emissive: "#fff",
    emissiveIntensity: .0,
    toneMapped: false,
})

// torso, hips
export const alienShell = new MeshLambertMaterial({
    color: "#0a70ff",
    emissive: "#d6dbe4",
    emissiveIntensity: .0,
    toneMapped: false,
})

// chest panel, upper arms
export const alienAccent = new MeshLambertMaterial({
    color: "#ffd07c",
    emissive: "#ffd07c",
    emissiveIntensity: .25,
    toneMapped: false,
})

// lower legs, mouth
export const alienLeg = new MeshLambertMaterial({
    color: "#8f949e",
    emissive: "#8f949e",
    emissiveIntensity: .25,
    toneMapped: false,
})

// player craft

export const craftHull = new MeshLambertMaterial({
    color: "#f2f7ff",
    emissive: "#f2f7ff",
    emissiveIntensity: .20,
    toneMapped: false,
})

export const craftCabin = new MeshLambertMaterial({
    color: "#edf0f5",
    emissive: "#fff",
    emissiveIntensity: .0,
    toneMapped: false,
})

export const craftWindows = new MeshLambertMaterial({
    color: "#115",
    toneMapped: false,
})

export const craftWings = new MeshLambertMaterial({
    color: "#0a70ff",
    emissive: "#d6dbe4",
    emissiveIntensity: .0,
    toneMapped: false,
})
