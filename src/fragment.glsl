precision mediump float; 

varying vec3 vPosition;  
uniform sampler2D cut;
uniform sampler2D playerPosition;
uniform sampler2D gap;
 
void main() {
    vec3 top = vec3(.05, .3, .2);
    vec3 bottom = vec3(0., 1., 0.);
    float u1 = texture2D(cut, vec2(0.,0.)).r;
    float u2 = texture2D(playerPosition, vec2(0.,0.)).r;
    float u3 = texture2D(gap, vec2(0.,0.)).r;


    gl_FragColor = vec4(mix(top, bottom, vPosition.y/2.), clamp(vPosition.y/.25, 0., 1.)); // 
}