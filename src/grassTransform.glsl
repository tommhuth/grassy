@import ./noise;

// utils
float easeInOutCubic(float x) {
    return x < 0.5 ? 4. * x * x * x : 1. - pow(-2. * x + 2., 3.) / 2.;
}
 
vec3 grassTransform(vec3 position) {
    vec3 p = vec3(position.xyz);
    vec2 uv = vec2((p.x + 25.) / 50., (-p.z + 25.) / 50.);
    bool isGap = texture2D(gap, uv).r > 0.; 

    if (isGap) { 
        p.y = -.1;
    } else { 
        float cutGrade = clamp(1. - texture2D(cut, uv).r - texture2D(playerPosition, uv).r, 0., 1.); 

        if (cutGrade > 0.) {
            float windStrength = noise(vec3(p.x * .05 + 75., time, p.z * .05 + 75.)) * 1.;
            float wind = noise(vec3(p.x * .05, time, p.z * .05)) * windStrength;

            wind += noise(vec3(p.x * .1, time * .25, p.z * .1)) * .2;
            wind *= clamp(p.y / 2. - .25, 0., 1.);

            p.x += wind;
            p.z += wind * .8;
        }

        p.y *= easeInOutCubic(max(cutGrade, cutHeight)) * height;  

    } 

    return p;
}