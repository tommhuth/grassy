import { useShader } from "@src/hooks/use-shader"
import { useStore } from "@lib/store"
import { useFrame } from "@react-three/fiber"
import noise from "@shaders/noise.glsl"
import utils from "@shaders/utils.glsl"
import { Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { grassWildness, worldSize } from "@lib/sim/const"
import { sim } from "@lib/sim/sim"

export default function Ground() {
    const { onBeforeCompile, uniforms } = useShader({
        uniforms: {
            uWorldSize: { value: worldSize },
            uWildness: { value: grassWildness },
            uCutMap: { value: sim.map.cut.texture },
            uAoMap: { value: sim.map.ao.texture },
            uTrailMap: { value: sim.map.trail.texture },
            uSurveying: { value: 0 },
            uPlayerPosition: { value: new Vector3() },
        },
        shared: /* glsl */`
            varying vec3 vWorldPosition;
            uniform float uWorldSize;
            uniform float uWildness;
            uniform sampler2D uCutMap;
            uniform sampler2D uTrailMap;
            uniform sampler2D uAoMap;
            uniform float uSurveying;
            uniform vec3 uPlayerPosition;

            ${utils}

            float getSurveyRadius(vec3 position, vec3 playerPosition){
                float surveyMaxRadius = 40.;
                float surveyFade = 6.;
                float surveyRadius = mix(-surveyFade, surveyMaxRadius, uSurveying);
                float surveyDist = length(playerPosition - position);

                return smoothstep(surveyRadius, surveyRadius + surveyFade, surveyDist);
            }

            float getWorldBounds(vec3 position, float fadeDistance, float inset){
                float size = uWorldSize / 2. - inset;

                return map(position.x, size, size + fadeDistance, 1., 0.)
                    * map(position.x, -size - fadeDistance, -size, 0., 1.)
                    * map(position.z, size, size + fadeDistance, 1., 0.)
                    * map(position.z, -size - fadeDistance, -size, 0., 1.);
            }
        `,
        vertex: {
            main: /* glsl */`
                vWorldPosition = (modelMatrix * vec4(transformed, 1.)).xyz;
            `
        },
        fragment: {
            head: /* glsl */`
                ${noise}
 
                // thickness is in pixels, ~1.-1.5 looks right
                float grid(vec2 position, float spacing, float thickness) {
                    vec2 uv = position / spacing;
                    // divide by zero  guard
                    vec2 w = max(fwidth(uv), vec2(1e-5));
                    vec2 d = abs(fract(uv - .5) - .5) / w;

                    return 1. - min(min(d.x, d.y) / thickness, 1.);
                }
            `,
            main: /* glsl */`
                vec3 darken = vec3(0. / 255., 5. / 255., 15. / 255.);
                float fadeDistance = 4.;
                float n = (1. - (noise(vWorldPosition.xz * .05) * .5 + .5) * uWildness)
                        * getWorldBounds(vWorldPosition, 4., fadeDistance * .25);

                // the sim camera looks down +y, so screen up is world -z and the
                // maps come out with z inverted. render targets are flipY false,
                // unlike the canvas textures this replaced, and the two cancel out
                vec2 mapUv = (vWorldPosition.xz * vec2(1., -1.) + uWorldSize / 2.) / uWorldSize;
                // .r cut, .g obstacles
                vec4 cut = texture2D(uCutMap, mapUv);
                vec4 trail = texture2D(uTrailMap, mapUv);
                // sharp for now, no mipmaps to sample and the blurred ao map is
                // not wired up yet
                vec4 pushSoft = texture2D(uAoMap, mapUv);

                gl_FragColor.rgb = mix(
                    gl_FragColor.rgb,
                    darken,
                    smoothstep(.0, 1., n * (1. - max(pushSoft.r, pushSoft.g)))
                ); 

                // uniform branch, so it stays coherent; .5 is where the smoothstep below already zeroed out
                if (uSurveying > .5) {
                    // obstacles live in the cut map now, both write once and never decay
                    float hole = cut.g;

                    vec3 overlayGridColor = mix(
                        gl_FragColor.rgb * .65, // darker
                        gl_FragColor.rgb + vec3(0., .8, 1.) * .1, // lighter
                        grid(vWorldPosition.xz, .5, 2.)
                    );
                    vec3 overlayCutColor = mix(
                        gl_FragColor.rgb * vec3(0., 4.5, 3.5), // cold blue green
                        gl_FragColor.rgb * vec3(0., 3., 3.) + .05, // lighter
                        grid(vWorldPosition.xz, .5, 2.)
                    );

                    gl_FragColor.rgb = mix(
                        gl_FragColor.rgb,
                        mix(overlayGridColor, overlayCutColor, cut.r),
                        getWorldBounds(vWorldPosition, 0., 0.)
                            * (1. - hole)
                            * smoothstep(.5, 1., uSurveying)
                            * (1. - getSurveyRadius(vWorldPosition, uPlayerPosition))
                    );
                }
            `
        }
    })

    useFrame((state, delta) => {
        let { player } = useStore.getState()
        let lambda = player.surveying ? 2 : 3

        uniforms.uSurveying.value = damp(uniforms.uSurveying.value, player.surveying ? 1 : 0, lambda, delta)

        if (player.mesh) {
            uniforms.uPlayerPosition.value.copy(player.mesh.position)
        }
    })

    return (
        <>
            <mesh position={[0, -.05, 0]} receiveShadow>
                <boxGeometry args={[200, .1, 200]} />
                <meshLambertMaterial
                    onBeforeCompile={onBeforeCompile}
                    color={"#2c414d"}
                />
            </mesh>
            <mesh visible={false} position={[0, -.05, 0]} receiveShadow>
                <boxGeometry args={[worldSize, .1, worldSize]} />
                <meshLambertMaterial
                    map={sim.map.ao.texture}
                />
            </mesh>
        </>
    )
}
