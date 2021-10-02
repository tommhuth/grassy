precision highp float; 

varying vec3 vPosition; 
uniform vec3 mvPosition;
uniform float time;
uniform float height;
uniform float cutHeight;
uniform sampler2D cut;
uniform sampler2D playerPosition;
uniform sampler2D gap;

@import ./grassTransform;
 
void main() {
    vPosition = position; 

    gl_Position = projectionMatrix * modelViewMatrix * vec4(grassTransform(position), 1.);
}