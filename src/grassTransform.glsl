@import ./noise;

float easeInOutQuad(float x) {
    return x < 0.5 ? 2. * x * x : 1. - pow(-2. * x + 2., 2.) / 2.;
}
 
vec3 grassTransform(vec3 position, vec3 wp) { 
    vec3 p = position.xyz; 
    vec2 uv = vec2((wp.x + uSize / 2.) / uSize, (-wp.z + uSize/2.) / uSize);
    bool isGap = texture2D(uGap, uv).r > 0.;   
    float naturalHeight = 2.5; // mesh natural height

    if (isGap) { 
        p.y = -.1;
    } else {      
        float pushGrade = max(texture2D(uPlayerPosition, uv).r , texture2D(uCut, uv).r); 
        float heightEase = clamp(p.y / naturalHeight - .25, 0., 1.); 
        float y = clamp(1. - pushGrade, uCutHeight, 1.);
         
        y *= 1. - ((noise(wp.xz * .05) + 1.) / 2.) * uWildness;
        y *= uHeight; // height scaler uniform 
        y *= 1. - max(pushGrade, uCutHeight / naturalHeight);

        p.y *= max(y, uCutHeight);
    
        float wind = noise(wp.xz * .025 + uTime) * (p.y / (uHeight * naturalHeight));
            
        wind *= heightEase;

        p.x += wind;
        p.z += wind; 

        float wind2 = noise(wp.xz * .2 + uTime) * heightEase * .1 * (p.y / naturalHeight);

        p.x += wind2;
        p.z += wind2; 
    } 

    vec3 direction = uMousePosition - wp.xyz;
    float radius = 8.;
    float scale = 1. - clamp(length(direction) / radius, 0., 1.); 

    p += -normalize(direction) * easeInOutQuad(scale) * 2. * uMouseEffect ;

    return p;
}
  