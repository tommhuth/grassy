float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
    float t = clamp((value - inMin) / (inMax - inMin), 0.0, 1.0);
    return outMin + t * (outMax - outMin);
}