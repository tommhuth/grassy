precision mediump float; 

varying vec3 vPosition;  
 
void main() {
    vec3 top = vec3(.05, .3, .2);
    vec3 bottom = vec3(0., 1., 0.);

    gl_FragColor = vec4(mix(top, bottom, vPosition.y/2.), 1.); // clamp(vPosition.y/1., 0., 1.)
}