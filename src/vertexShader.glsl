varying float vDepth;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z; // Capture the depth in view space
    gl_Position = projectionMatrix * mvPosition;
}