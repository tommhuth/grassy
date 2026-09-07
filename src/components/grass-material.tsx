import { DoubleSide, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from "three"
import easings from "@shaders/easings.glsl"
import utils from "@shaders/utils.glsl"
import noise from "@shaders/noise.glsl"
import { cutTexture, grassWildness, overlapTexture, worldsize } from "./grasssim"

const grassHeight = 1.5
const cutHeight = .15 // 0 - 1 scale 

const shared = /* glsl */`
    uniform sampler2D uCutMap;
    uniform sampler2D uOverlapMap;
    uniform float uWorldSize;
    uniform float uTime;
    uniform float uHeight;
    uniform float uWildness;
    uniform float uCutHeight;
    uniform float uOcclusionLod;
    uniform float uSurveying;
    uniform vec3 uPlayerPosition;
    varying vec3 vWorldPosition;
    varying vec3 vBentWorldPosition;
    varying float vOcclusion;
    varying float vCut;
    varying vec2 vUv;

    ${noise}
    ${easings}
    ${utils}

    float getSurveyRadius(vec2 position, vec2 playerPosition){
        float surveyMaxRadius = 8.;
        float surveyFade = 6.;
        float surveyRadius = mix(-surveyFade, surveyMaxRadius, uSurveying);
        float surveyDist = length(playerPosition - position);

        return smoothstep(surveyRadius, surveyRadius + surveyFade, surveyDist);
    }
`

const vertexShader = /* glsl */`
    ${shared}

    #include <common>
    #include <shadowmap_pars_vertex>
    
    // from model, position of grass blade
    attribute vec3 _bladepos;

    void main() {   
        vec3 bladePosition = (modelMatrix * instanceMatrix * vec4(_bladepos, 1.)).xyz; 

        // three flips the y coord of textures 
        vec2 mapUv = (bladePosition.xz * vec2(1., -1.) + uWorldSize / 2.) / uWorldSize;

        vec4 overlap = texture2D(uOverlapMap, mapUv);
        // uv.y is 1 at the blade root, 0 at the tip 
        float bladeProgress = 1. - uv.y;
        float bladeMeshHeight = 2.73; // tallest blade in the mesh, only to put uCutHeight in mesh units
        // red channel = obstacles
        float gap = step(.05, overlap.r);
        // green channel = player trail, cut map = mowed
        float pushGrade = max(overlap.g, 0.);

        vCut = texture2D(uCutMap, mapUv).r;
       
        // height variation
        float baseHeightNoise = 1. - (noise(bladePosition.xz * .05) * .5 + .5) * uWildness;
        float bladeScale = max(
            (1. - pushGrade)
                * baseHeightNoise
                * uHeight // height scaler uniform
                * (1. - max(pushGrade, uCutHeight / bladeMeshHeight)),
            uCutHeight
        );

        bladeScale = mix(bladeScale, .5, vCut);

        float y = mix(position.y * bladeScale, -.1, gap);
        // one taper for wind: 0 at the root, 1 at the tip of every blade
        float heightEase = pow(bladeProgress, 1.5);
        float sway = heightEase * bladeScale / uHeight;
        float baseWindNoise = noise(bladePosition.xz * .025 + uTime * .3) * .5 
            + noise(bladePosition.xz * .1 + uTime * 1.5 * .3) * .25;
        float wind = baseWindNoise * (1. - gap);  

        // every horizontal push, at full sway, in one vector
        vec3 bend = vec3(wind, 0., wind);

        vec3 transformed = vec3(position.x, y, position.z) + bend * sway; 

        // sample lower res texture for auto soften map sample
        float pushSoft = max(
            textureLod(uOverlapMap, mapUv, uOcclusionLod).g,
            textureLod(uCutMap, mapUv, uOcclusionLod).r
        );
        
        // darken lower part of blade
        vOcclusion = baseHeightNoise
            * (1. - pushSoft)
            * easeOutQuart(map(transformed.y, 0., bladeMeshHeight, 1., 0.)); 

        vUv = uv;
        vWorldPosition = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz;

        // shadow handling chunk expects these to be defined
        vec4 worldPosition = modelMatrix * instanceMatrix * vec4(transformed, 1.); 
        vec3 transformedNormal = normalMatrix * normal;

        vBentWorldPosition = worldPosition.xyz;

        #include <shadowmap_vertex>

        gl_Position = projectionMatrix 
            * modelViewMatrix 
            * instanceMatrix 
            * vec4(transformed, 1.);
    }
`

const fragmentShader = /* glsl */`
    ${shared}

    // include shadow parts
    #include <packing>
    #include <shadowmap_pars_fragment>

    // uv.x is 0 on one rail of the blade and 1 on the other, so this is the screen
    // space distance to the nearest long edge: the blade's own contour. neat.
    // the stroke walks in from the centerline (t = 0, a solid blade) to a thin line (t = 1)
    float getOutline(float t) {
        float strokeWidth = 1.5; // px, at t = 1
        float dist = min(vUv.x, 1. - vUv.x);
        // uv.x per pixel, so the stroke can be sized in screen space
        float px = max(fwidth(vUv.x), 1e-5);
        // .5 is the blade centerline, so the start has to clear the smoothstep band
        // above it or a 1px seam gets cut down the middle at t = 0
        float stroke = mix(.5 + px, px * strokeWidth, t);

        return 1. - smoothstep(stroke - px, stroke, dist);
    }

    void main() {
        float shadow = getShadow(
            directionalShadowMap[0],
            directionalLightShadows[0].shadowMapSize,
            directionalLightShadows[0].shadowIntensity,
            directionalLightShadows[0].shadowBias,
            directionalLightShadows[0].shadowRadius,
            vDirectionalShadowCoord[0]
        );

        vec3 top = vec3(255. / 255., 242. / 255., 133. / 255.);
        vec3 bottom = vec3(0., 122. / 255., 100. / 255.);
        vec3 darken =  vec3(0. / 255., 10. / 255., 60. / 255.); 
        vec3 shadowColor = vec3(0. / 255., 65. / 255., 85. / 255.); 

        gl_FragColor.a = 1.;
        gl_FragColor.rgb = mix(
            bottom,
            mix(
                top, 
                vec3(180. / 255., 235. / 255., 53. / 255.), 
                noise(vWorldPosition * .8) * .5 + .5
            ),
            clamp(vWorldPosition.y / (1.5 * uHeight), -.25, 1.)
        ); 

        gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            mix(
                vec3(0., .1, 1.), 
                vec3(0., 1., 1.), 
                smoothstep(.0, uHeight, vWorldPosition.y)
            ),
            uSurveying
        ); 

        gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            gl_FragColor.rgb * darken, 
            smoothstep(.1, 1., vOcclusion)
        );

        gl_FragColor.rgb = mix(
            gl_FragColor.rgb * shadowColor,
            gl_FragColor.rgb ,
            shadow
        ); 

        // surveying hollows each blade out to its contour 
        float outline = getOutline(smoothstep(.2, .8, uSurveying));

        gl_FragColor.a = getSurveyRadius(vBentWorldPosition.xz, uPlayerPosition.xz) * outline;

        // the hollow interior has to go before the depth write, or blades in front
        // would occlude the ones behind them instead of layering up
        if ((vCut > .1 && vBentWorldPosition.y > .4) || outline < .01 || gl_FragColor.a < .01) {
            discard;
        }
    }
`

export default class GrassMaterial extends ShaderMaterial {
    lights = true
    side = DoubleSide
    vertexShader = vertexShader
    transparent = true
    fragmentShader = fragmentShader
    uniforms = {
        // required for lights/shadow calc
        ...UniformsUtils.clone(UniformsLib.lights),
        uCutMap: { value: cutTexture },
        uOverlapMap: { value: overlapTexture },
        uWorldSize: { value: worldsize },
        uTime: { value: 0 },
        uHeight: { value: grassHeight },
        uWildness: { value: grassWildness },
        uCutHeight: { value: cutHeight },
        // mip map level, 0-9
        uOcclusionLod: { value: 5 },
        uSurveying: { value: 0 },
        uPlayerPosition: { value: new Vector3() },
    }
}