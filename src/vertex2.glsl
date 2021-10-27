varying vec3 vPosition; 
uniform float time;  
uniform float size;  
uniform float x;  
uniform float z;    
uniform float windScale;
uniform float height;
uniform float cutHeight;
uniform float wildness;
uniform float scale;
uniform sampler2D cut;
uniform sampler2D playerPosition;
uniform sampler2D gap;

@import ./noise;

vec3 grassTransform(vec3 position) {
    vec3 p = vec3(position.xyz);
    vec4 wp = modelMatrix * vec4(p, 1.); 
    vec2 uv = vec2((wp.x + size/2.) / size, (-wp.z + size/2.) / size);
    bool isGap = texture2D(gap, uv).r > 0.;   

    if (isGap) { 
        p.y = -.1;
    } else { 
        float y = 1. - max(texture2D(cut, uv).r - cutHeight, texture2D(playerPosition, uv).r);

        float scaleHeight = noise(vec3(wp.x  * scale, .0, wp.z * scale)) * wildness; 
        float windStrength = noise(vec3(wp.x * .05 + time + 75., 0., wp.z * .05 + 75.)) * windScale;
        float wind = noise(vec3(wp.x  * .05 + time , .0, wp.z * .05 + time * .1)) * windStrength;
            
        wind *= clamp(p.y / 2. - .25, 0., y);

        p.x += wind;
        p.z += wind; 

        p.y *= y * (height + scaleHeight);
    } 

    return p;
}

void main() {
    vPosition = position; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(grassTransform(position), 1.);
}