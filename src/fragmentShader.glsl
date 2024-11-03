varying float vDepth;

void main() {
    // Normalize depth to a range for color mapping
    float depthNormalized = vDepth / 100.0; // Adjust the divisor based on scene depth range
    vec3 color = vec3(depthNormalized, 0.0, 1.0 - depthNormalized); // Simple gradient from blue to red
    gl_FragColor = vec4(color, 1.0);
}