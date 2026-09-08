import { ShaderMaterial, Texture, Vector2 } from "three"
import { aoSize } from "./const"
import { quadVertexShader } from "./helpers"

// 9 tap gaussian, one axis per render, separable 
export class BlurMaterial extends ShaderMaterial {
    depthTest = false
    depthWrite = false
    vertexShader = quadVertexShader
    fragmentShader = /* glsl */`
        uniform sampler2D uTexture;
        uniform vec2 uDirection; // texels along the axis being blurred
        uniform vec2 uResolution;

        varying vec2 vUv;

        void main() {
            vec2 off = uDirection / uResolution;
            vec4 c = vec4(0.);

            c += texture2D(uTexture, vUv - off * 4.) * .05;
            c += texture2D(uTexture, vUv - off * 3.) * .09;
            c += texture2D(uTexture, vUv - off * 2.) * .12;
            c += texture2D(uTexture, vUv - off) * .15;
            c += texture2D(uTexture, vUv) * .18;
            c += texture2D(uTexture, vUv + off) * .15;
            c += texture2D(uTexture, vUv + off * 2.) * .12;
            c += texture2D(uTexture, vUv + off * 3.) * .09;
            c += texture2D(uTexture, vUv + off * 4.) * .05;

            gl_FragColor = c;
        }
    `
    uniforms = {
        uTexture: { value: null as Texture | null },
        uDirection: { value: new Vector2() },
        uResolution: { value: new Vector2(aoSize, aoSize) },
    }
}
