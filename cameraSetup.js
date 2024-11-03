// Request camera access
navigator.mediaDevices.getUserMedia({ video: true })
.then((stream) => {
    let video = document.getElementById('videoInput');
    video.srcObject = stream;
    video.play();

    // Wait until video metadata is loaded (dimensions ready)
    video.addEventListener('loadedmetadata', onVideoLoaded, false);
})
.catch((err) => {
    console.error("Error accessing camera: " + err);
});

// OpenCV initialization
cv['onRuntimeInitialized'] = () => {
console.log("OpenCV.js is ready.");
};