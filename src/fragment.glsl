
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision mediump float;
#else
precision mediump float;
#endif

varying vec3 vUv;  
 
void main() {
    vec3 top = vec3(.05, .3, .2);
    vec3 bottom = vec3(0., 1., 0.);

    gl_FragColor = vec4(mix(top, bottom, vUv.y/2.), 1.);
}