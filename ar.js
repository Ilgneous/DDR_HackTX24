// Set up scene
const scene = new THREE.Scene();

// Set up camera
// Args(FOV, Aspect Ratio, Near Clipping Plane Distance, Far Clipping Plane Distance)
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
camera.position.set(0, 1.6, 3); // Position the camera for AR (X,Y,Z)

// Set up renderer with WebXR
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

let reticle;
const loader = new THREE.GLTFLoader(); // Load your 3D object
loader.load('path/to/model.glb', (gltf) => {
  const object = gltf.scene;
  object.visible = false; // Hide object until we detect a floor
  scene.add(object);
});

// Set up WebXR hit testing
navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'] }).then((session) => {
  session.requestReferenceSpace('local').then((refSpace) => {
    renderer.xr.setSession(session);

    // Add a reticle to indicate placement
    const geometry = new THREE.RingGeometry(0.1, 0.15, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    reticle = new THREE.Mesh(geometry, material);
    reticle.rotation.x = -Math.PI / 2;
    scene.add(reticle);

    session.requestHitTestSource({ space: refSpace }).then((hitTestSource) => {
      renderer.setAnimationLoop((timestamp, frame) => {
        if (frame) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(refSpace);

            // Position the reticle at the hit point
            reticle.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            reticle.visible = true;

            // Make the 3D object visible and align it with the reticle
            object.position.copy(reticle.position);
            object.visible = true;
          }
        }

        renderer.render(scene, camera);
      });
    });
  });
});

renderer.domElement.addEventListener('click', () => {
    if (reticle.visible) {
      object.position.copy(reticle.position);
      object.visible = true;
      reticle.visible = false; // Hide the reticle after placement
    }
  });
  
