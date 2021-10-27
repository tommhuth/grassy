precision highp float; 

varying vec3 vPosition; 
uniform vec3 mvPosition;
uniform float time;
uniform float windScale;
uniform float height;
uniform float cutHeight;
uniform float wildness;
uniform float scale;
uniform sampler2D cut;
uniform sampler2D playerPosition;
uniform sampler2D gap;
uniform float size;  

@import ./grassTransform;
 
void main() {
    vPosition = position; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(grassTransform(position), 1.);
}