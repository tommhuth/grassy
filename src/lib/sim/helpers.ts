import { Camera, CircleGeometry, Material, PlaneGeometry, Scene, WebGLRenderer } from "three"

// unit geometry lying in xz, scaled per stamp, so world units are mask units
export function flat(geometry: CircleGeometry | PlaneGeometry) {
    geometry.rotateX(-Math.PI / 2)

    return geometry
}

// the full screen quad geometry is already in ndc, so xy passes straight
// through: no matrices, and the material stays camera independent
export const quadVertexShader = /* glsl */`
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0., 1.);
    }
`

// masks whatever sits on one layer of the real scene into the bound target
export function renderLayer(
    gl: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    material: Material,
    layer: number
) {
    const background = scene.background

    // a Color background forceClears the target inside WebGLBackground and
    // ignores autoClear, so it has to go for the duration of the pass
    scene.background = null
    scene.overrideMaterial = material
    camera.layers.set(layer)
    gl.render(scene, camera)
    scene.overrideMaterial = null
    scene.background = background
}
