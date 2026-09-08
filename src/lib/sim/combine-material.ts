import { ShaderMaterial, Texture } from "three"
import { quadVertexShader } from "./helpers"

// folds both source textures into one target so the blur has a single thing to walk 
export class CombineMaterial extends ShaderMaterial {
    constructor(cut: Texture, trail: Texture) {
        super({
            depthTest: false,
            depthWrite: false,
            vertexShader: quadVertexShader,
            fragmentShader: /* glsl */`
                uniform sampler2D uCutMap;   // .r cut, .g obstacles
                uniform sampler2D uTrailMap; // .g trail

                varying vec2 vUv;

                void main() {
                    vec4 cut = texture2D(uCutMap, vUv);

                    gl_FragColor = vec4(max(cut.r, texture2D(uTrailMap, vUv).g), cut.g, 0., 1.);
                }
            `,
            uniforms: {
                uCutMap: { value: cut },
                uTrailMap: { value: trail },
            },
        })
    }
}
