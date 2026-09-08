import { Scene, WebGLRenderer } from "three"
import { useStore } from "../store"
import { blurIterations, blurScale, dilation, layers, textureSize } from "./const"
import { getProgress } from "./get-progress"
import { renderLayer } from "./helpers"
import { sim } from "./sim"

let time = 0
// the async read writes straight into the buffer it was handed, guard against
// pending write
let reading = false

export function step(gl: WebGLRenderer, scene: Scene, delta: number) {
    const { player } = useStore.getState()
    const cut = player.active ? player.mesh : null

    gl.autoClear = false

    if (sim.obstaclesDirty || cut) {
        gl.setRenderTarget(sim.map.cut)

        if (sim.obstaclesDirty) {
            // rocks and boxes are real meshes in the r3f tree, so paint them
            // through the main scene with one override material
            renderLayer(gl, scene, sim.camera, sim.shaders.cut, layers.obstacle)
            sim.obstaclesDirty = false
        }

        if (cut) {
            // render cut shape to texture
            sim.proxy.cut.position.set(cut.position.x, 0, cut.position.z)
            sim.proxy.cut.scale.setScalar(player.size[2] / 2 + dilation)
            sim.camera.layers.enableAll()
            gl.render(sim.scene, sim.camera)
        }
    }

    // fade trail
    gl.setRenderTarget(sim.map.trail)
    sim.shaders.trail.opacity = 1 - Math.exp(-Math.min(delta, .1) / .4)
    sim.quad.material = sim.shaders.trail
    sim.quad.render(gl)

    // the real silhouette from above, so no proxy to keep in sync with the
    // model. MaxEquation unions the sub meshes instead of accumulating them
    renderLayer(gl, scene, sim.camera, sim.shaders.cut, layers.player)

    // ao
    gl.setRenderTarget(sim.map.ao)
    gl.clear(true, false, false)
    sim.quad.material = sim.shaders.combine
    sim.quad.render(gl)

    // blur
    const uniforms = sim.shaders.blur.uniforms
    sim.quad.material = sim.shaders.blur

    for (let i = 0; i < blurIterations; i++) {
        uniforms.uTexture.value = sim.map.ao.texture
        uniforms.uDirection.value.set(blurScale, 0)
        gl.setRenderTarget(sim.map.aoTemp)
        gl.clear(true, false, false)
        sim.quad.render(gl)

        uniforms.uTexture.value = sim.map.aoTemp.texture
        uniforms.uDirection.value.set(0, blurScale)
        gl.setRenderTarget(sim.map.ao)
        gl.clear(true, false, false)
        sim.quad.render(gl)
    }

    // sim render done, reset
    gl.setRenderTarget(null)
    gl.autoClear = true
    sim.camera.layers.enableAll()

    // progress calc 
    if (!reading && time > 2) {
        time = 0
        reading = true

        gl.readRenderTargetPixelsAsync(sim.map.cut, 0, 0, textureSize, textureSize, sim.pixels)
            .then(getProgress)
            .finally(() => reading = false)
    }

    time += delta
}
