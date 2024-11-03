import * as THREE from 'three'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: 800,
    height: 600
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(100, sizes.width / sizes.height)
camera.position.z = 3
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

/**
 * Materials
 */
const grad_material = new THREE.ShaderMaterial({
    uniforms: {
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        minDepth: { value: 0.0 },
        maxDepth: { value: 8.0 },
    },
    vertexShader: `
        varying float vDepth;
        
        void main() {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;
            vDepth = -modelViewPosition.z;
        }
    `,
    fragmentShader: `
        uniform float minDepth;
        uniform float maxDepth;
        varying float vDepth;
        
        void main() {
            float normalizedDepth = clamp((vDepth - minDepth) / (maxDepth - minDepth), 0.0, 1.0);
            vec3 color = mix(
                vec3(255.0 / 255.0, 0.0 / 255.0, 255.0 / 255.0),
                vec3(64.0 / 255.0, 0.0 / 255.0, 123.0 / 255.0),
                normalizedDepth
            );

            gl_FragColor = vec4(color, 1.0);
        }
    `
});
const gui = new GUI()

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null


let arrowModel;
let arrows = [];

// Modified loader function to create multiple arrows
gltfLoader.load(
    'pink_arrow.glb',
    (gltf) => {
        // Create initial set of arrows
        const arrow = gltf.scene.clone();
        arrow.scale.set(0.5, 0.5, 0.5);
        arrow.position.y = -8;
        scene.add(arrow);
        arrows.push(arrow);
        arrowModel = arrow;
        
        // Create lines after arrows are loaded
        initializeTubes();
    }
);

/**
 * Objects
 */
// Create cube
const cubeGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

// Calculate spawn position at top of plane
const planeLength = 30; // Length of the plane
const planeAngle = Math.PI / 4; // Rotation of the plane
const spawnDistance = planeLength / 2; // Distance from center to top of plane

const plane_geometry = new THREE.PlaneGeometry(8, planeLength);
const plane = new THREE.Mesh(plane_geometry, grad_material);
plane.rotation.x = -planeAngle;
plane.position.z = -10;
plane.position.y = 8;
scene.add(plane);


// Create 3D lines along the plane to represent channels - HERE




// Set initial cube position
cube.position.y = plane.position.y + spawnDistance * Math.cos(planeAngle);
cube.position.z = plane.position.z + spawnDistance * -Math.sin(planeAngle);
scene.add(cube);


const NUM_CHANNELS = 4;


let score = 0;



// Animate cube
const animateCube = (channel) => {
    // Calculate end position (bottom of plane)

    cube.position.x = channel * (plane.geometry.parameters.width / NUM_CHANNELS) - plane.geometry.parameters.width / 2 + 2;

    const endY = plane.position.y - spawnDistance * Math.cos(planeAngle);
    const endZ = plane.position.z - spawnDistance * -Math.sin(planeAngle);

    gsap.to(cube.position, {
        duration: 10,
        y: endY,
        z: endZ,
        ease: "power1.inOut",
        onComplete: () => {
            // Reset cube position and animate again
            cube.position.y = plane.position.y + spawnDistance * Math.cos(planeAngle);
            cube.position.z = plane.position.z + spawnDistance * -Math.sin(planeAngle);
            animateCube(channel += 1);
        }
    });
};

const animateArrow = (arrow, channel) => {
    const initialY = plane.position.y + spawnDistance * Math.cos(planeAngle);
    const initialZ = plane.position.z + spawnDistance * -Math.sin(planeAngle);

    const offset = new THREE.Vector3(1.25, 0, 0);
    const borderWidth = 0;

    arrow.position.x = channel * (plane.geometry.parameters.width - (borderWidth * 2)) / NUM_CHANNELS 
        - plane.geometry.parameters.width / 2 + borderWidth;
    arrow.position.y = initialY + offset.y;
    arrow.position.z = initialZ + offset.z;   

    const endY = plane.position.y - spawnDistance * Math.cos(planeAngle) + offset.y;
    const endZ = plane.position.z - spawnDistance * -Math.sin(planeAngle) + offset.z;

    arrow.rotation.x = 3 * Math.PI / 4;   
    arrow.rotation.y = Math.PI / 2; 

    gsap.to(arrow.position, {
        duration: 4,
        y: endY,
        z: endZ,
        ease: "linear",
        onUpdate: () => {
            checkHitDetection(arrow);
        },
        onComplete: () => {
            arrow.position.y = initialY;
            arrow.position.z = initialZ;
            scene.remove(arrow);
        }
    });
};


const spawnNewArrow = (channel) => {
    if (arrows.length > 0) { // Make sure we have the original to clone
        const newArrow = arrows[0].clone();
        scene.add(newArrow);
        arrows.push(newArrow);
        animateArrow(newArrow, channel);
    }
};

const createChannelTubes = () => {
    const planeWidth = plane.geometry.parameters.width;
    const planeHeight = plane.geometry.parameters.height;
    const channelWidth = planeWidth / NUM_CHANNELS;
    
    // Create a group to hold all tubes
    const tubesGroup = new THREE.Group();
    
    // Configure tube properties
    const tubeRadius = 0.05; // Match horizontal tubes
    const tubeSegments = 4;
    
    // Create glowing material for the tubes
    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        emissive: 0x666666,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    // Create vertical tubes for each channel division
    for (let i = 1; i < NUM_CHANNELS; i++) {
        const tubeGeometry = new THREE.CylinderGeometry(
            tubeRadius, // radiusTop
            tubeRadius, // radiusBottom
            planeHeight, // height
            tubeSegments, // radialSegments
            1, // heightSegments
            false // openEnded
        );
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Position the tube
        tube.position.x = channelWidth * i - planeWidth / 2;
        tube.position.z = .2;
        
        tubesGroup.add(tube);
        
        // Add subtle pulsing animation
        gsap.to(tube.material, {
            emissiveIntensity: 0.8,
            duration: 1.5 + Math.random(), // Slightly different timing than horizontal tubes
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random() // Random delay for variety
        });
    }
    
    // Add the tubes group to the plane before rotation
    plane.add(tubesGroup);
    
    return tubesGroup;
};

// Create a function to initialize all tubes
const initializeTubes = () => {
    // Create horizontal tubes first
    const horizontalTubes = createHorizontalTubes();
    
    // Create vertical channel tubes
    const verticalTubes = createChannelTubes();
    
    // Optional: Add interaction effects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Add hover effect to tubes
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / sizes.width) * 2 - 1;
        mouse.y = -(event.clientY / sizes.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Get all tubes
        const allTubes = [...horizontalTubes.children, ...verticalTubes.children];
        const intersects = raycaster.intersectObjects(allTubes);
        
        // Reset all tubes
        allTubes.forEach(tube => {
            if (tube.material.emissiveIntensity > 1) {
                gsap.to(tube.material, {
                    emissiveIntensity: 0.5,
                    duration: 0.3
                });
            }
        });
        
        // Highlight hovered tube
        if (intersects.length > 0) {
            gsap.to(intersects[0].object.material, {
                emissiveIntensity: 1.5,
                duration: 0.3
            });
        }
    });
    
    // animateTubes();
    
    return { horizontalTubes, verticalTubes };
};



let lowestY = 0;
// Create horizontal lines along the plane at arrow-length intervals
const createHorizontalTubes = () => {
    const planeWidth = plane.geometry.parameters.width;
    const planeHeight = plane.geometry.parameters.height;
    
    if (!arrowModel) {
        console.warn('Arrow model not loaded yet');
        return;
    }
    
    // Calculate arrow length using bounding box
    const boundingBox = new THREE.Box3().setFromObject(arrowModel);
    const arrowLength = boundingBox.max.z - boundingBox.min.z;
    
    // Create a group to hold all tubes
    const tubesGroup = new THREE.Group();
    
    // Configure tube properties
    const tubeRadius = 0.04; // Adjust for desired thickness
    const tubeSegments = 4; // Segments around the tube
    const spacing = arrowLength * 1.5;
    const numberOfTubes = Math.floor(planeHeight / spacing);
    
    // Create a glowing material for the tubes
    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        emissive: 0x666666,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    // Create tubes starting from bottom of plane
    for (let i = 0; i < 2; i++) {
        const yPosition = (-planeHeight / 2) + (i * spacing) + (spacing / 3);
        
        // Create cylinder geometry
        const tubeGeometry = new THREE.CylinderGeometry(
            tubeRadius, // radiusTop
            tubeRadius, // radiusBottom
            planeWidth, // height (using plane width as we'll rotate it)
            tubeSegments, // radialSegments
            1, // heightSegments
            false // openEnded
        );
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Rotate cylinder to lay flat
        tube.rotation.z = Math.PI / 2;
        
        // Position the tube
        tube.position.y = yPosition;
        
        tubesGroup.add(tube);
        
        // Optional: Add subtle animation
        gsap.to(tube.material, {
            emissiveIntensity: 0.8,
            duration: 1 + Math.random(),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }
    
    // Add the tubes group to the plane before rotation
    plane.add(tubesGroup);
    
    // Store the lowest tube's Y position in world coordinates for hit detection
    const worldPosition = new THREE.Vector3();
    const lowestTube = tubesGroup.children[0];
    lowestTube.getWorldPosition(worldPosition);
    lowestY = worldPosition.y;
    
    return tubesGroup;
};

const createHitDetection = () => {
    const planeLength = plane.geometry.parameters.height;
    const planeWidth = plane.geometry.parameters.width;
    
    // Create hit plane slightly taller than arrow to ensure good detection
    const hitGeometry = new THREE.PlaneGeometry(planeWidth, 2);
    const hitMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,  // Temporarily visible for debugging
        transparent: true,
        opacity: 0.0      // Semi-transparent for debugging
    });
    const hitPlane = new THREE.Mesh(hitGeometry, hitMaterial);
    
    // Calculate position at bottom of main plane
    const planeAngle = -Math.PI / 4; // Match main plane rotation
    const bottomOffset = planeLength / 2; // Distance from center to bottom of plane
    
    // Position hit plane relative to main plane
    hitPlane.position.y = plane.position.y - (bottomOffset * Math.cos(planeAngle));
    hitPlane.position.z = plane.position.z - (bottomOffset * Math.sin(planeAngle)) - 1 ;
    hitPlane.rotation.x = planeAngle;
    
    scene.add(hitPlane);
    
    // Store the hit plane's position for reference
    lowestY = hitPlane.position.y;
    
    return hitPlane;
};


let channel1Pressed = false;
let channel2Pressed = false;
let channel3Pressed = false;
let channel4Pressed = false;
let channelFirst = true;
let channel2First = true;
let channel3First = true;
let channel4First = true;

let tolerance = 100;

document.addEventListener('keydown', (event) => {
    // console.log("event", event.key);
    // console.log("channel1Pressed", channel1Pressed);
    if (event.key === '1' && channelFirst === true) {
        channel1Pressed = true;
        channelFirst = false;
        setTimeout(() => { channel1Pressed = false; }, 100);
    }
    if (event.key === '2' && channel2First === true) {
        channel2Pressed = true;
        channel2First = false;
        setTimeout(() => { channel2Pressed = false; }, 100);
    }
    if (event.key === '3' && channel3First === true) {
        channel3Pressed = true;
        channel3First = false;
        setTimeout(() => { channel3Pressed = false; }, 100);
    }
    if (event.key === '4' && channel4First === true) {
        channel4Pressed = true;
        channel4First = false;
        setTimeout(() => { channel4Pressed = false; }, 100);
    }
    console.log(channel2Pressed);
});

document.addEventListener('keyup', (event) => {
    if (event.key === '1') {
        channelFirst = true;
    } else if (event.key === '2') {
        channel2First = true;
    } else if (event.key === '3') {
        channel3First = true;
    } else if (event.key === '4') {
        channel4First = true;
    }
    console.log(channel2Pressed);
});


// Updated hit detection check with better positioning
const checkHitDetection = (() => {
    const arrowBox = new THREE.Box3()
    const hitBox = new THREE.Box3()
    const hitPlane = createHitDetection()
    
    return (arrow) => {
        arrowBox.setFromObject(arrow)
        hitBox.setFromObject(hitPlane)
        
        if (arrowBox.intersectsBox(hitBox)) {
            const channelWidth = plane.geometry.parameters.width / NUM_CHANNELS
            const channel = Math.floor((arrow.position.x + plane.geometry.parameters.width / 2) / channelWidth)

            if ((channel1Pressed && channel === 1) || 
                (channel2Pressed && channel === 2) || 
                (channel3Pressed && channel === 3) || 
                (channel4Pressed && channel === 4)) {
                
                let pos = arrow.position.clone()
                pos.x = pos.x - 1
                createHitEffect(pos)
                score += 1
                
                // Update score text
                console.log(scoreText);
                if (scoreText) {
                    // scene.remove(scoreText)
                    // scoreText.geometry.dispose() // Clean up old geometry
                    loadFont()
                }
            }
        }
    }
})()



// Enhanced hit effect for tubes
const createHitEffect = (position) => {
    const particleCount = 20;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.02, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Random velocity
        const velocity = {
            x: (Math.random() - 0.5) * 2,
            y: Math.random() * 2,
            z: (Math.random() - 0.5) * 2
        };
        
        particles.add(particle);
        
        // Animate particle
        gsap.to(particle.position, {
            x: particle.position.x + velocity.x,
            y: particle.position.y + velocity.y,
            z: particle.position.z + velocity.z,
            duration: 0.75,
            ease: "power2.out"
        });
        
        gsap.to(particle.material, {
            opacity: 0,
            duration: 0.75,
            ease: "power2.out",
            onComplete: () => {
                particle.removeFromParent();
                particle.geometry.dispose();
                particle.material.dispose();
            }
        });
    }
    
    scene.add(particles);
    
    // Remove particle group after animation
    setTimeout(() => {
        particles.removeFromParent();
    }, 1000);
};



const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(- 5, 5, 0)
scene.add(directionalLight)




// Add this after the scene creation:
const fontLoader = new FontLoader();
let scoreText;
const loadFont = () => {
    fontLoader.load(
        'DPComic_Regular.json', // Ensure this path is correct
        (font) => {
            const textGeometry = new TextGeometry("Score: " + score, {
                font: font,
                size: 0.6,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 0.01,
                bevelSize: 0.02,
                bevelSegments: 5
            });
    
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            scene.remove(scoreText);
            scoreText = new THREE.Mesh(textGeometry, textMaterial);
            scoreText.position.x = -4.5;
            scoreText.position.y = 2.5;
            scoreText.rotation.y = Math.PI / 4
            scoreText.rotation.x = Math.PI / 7
            // scoreText.position.z = -10;
            scene.add(scoreText);
        },
        undefined,
        (error) => {
            console.error('An error occurred loading the font:', error);
        }
    );
}
loadFont();

/**
 * Animation Loop
 */

const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    controls.update();
    renderer.render(scene, camera);

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // if(mixer)
    // {
    //     mixer.update(deltaTime)
    // }
    window.requestAnimationFrame(tick);
};

tick();
gui.add({ spawnNew: () => spawnNewArrow(Math.floor(Math.random() * NUM_CHANNELS) + 1) }, 'spawnNew').name('Spawn New Arrow');
