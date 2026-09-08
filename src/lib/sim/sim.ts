import { CircleGeometry, Mesh, Scene } from "three"
import { FullScreenQuad } from "three/examples/jsm/Addons.js"
import { BlurMaterial } from "./blur-material"
import { CombineMaterial } from "./combine-material"
import { aoSize, textureSize } from "./const"
import { FadeMaterial } from "./fade-material"
import { flat } from "./helpers"
import { MaskMaterial } from "./mask-material"
import { SimCamera } from "./sim-camera"
import { SimRenderTarget } from "./sim-render-target"

const map = {
    // accumulates forever, r is the cut, g holds the obstacles 
    cut: new SimRenderTarget(textureSize, "cut"),
    // fades every frame
    trail: new SimRenderTarget(textureSize, "trail"),
    // the horizontal half of each blur iteration lands here and the vertical
    // half writes back to ao, so neither pass ever samples its own target
    aoTemp: new SimRenderTarget(aoSize, "aoTemp"),
    // fully rewritten every frame: .r flattened blurred, .g obstacles blurred
    ao: new SimRenderTarget(aoSize, "ao"),
} as const

export const sim = {
    map,
    scene: new Scene(),
    camera: new SimCamera(),
    proxy: {
        cut: new Mesh(flat(new CircleGeometry(.5, 20)), new MaskMaterial(0xff0000)),
    },
    shaders: {
        // obstacles into map.cut.g and the player into map.trail.g
        cut: new MaskMaterial(0x00ff00),
        trail: new FadeMaterial(),
        combine: new CombineMaterial(map.cut.texture, map.trail.texture),
        blur: new BlurMaterial(),
    },
    quad: new FullScreenQuad(),
    // obstacles are static, so the bake only reruns when the set changes
    obstaclesDirty: true,
    // reused, otherwise every readback leaves textsize^2 * 4 bytes of garbage
    pixels: new Uint8Array(textureSize * textureSize * 4),
}

// after the literal, since wiring the proxies up needs both fields at once
for (const mesh of Object.values(sim.proxy)) {
    mesh.frustumCulled = false
    sim.scene.add(mesh)
}
