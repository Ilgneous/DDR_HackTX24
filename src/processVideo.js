// Detection status object accessible globally
window.detectionStatus = {
    greenLeft: false,
    greenRight: false,
    blueLeft: false,
    blueRight: false
};


function onVideoLoaded() {
    let video = document.getElementById('videoInput');
    let canvasOutput = document.getElementById('canvasOutput');
    let canvasMask = document.getElementById('canvasMask');
    let cap = new cv.VideoCapture(video);

    // Initialize Mats for frame and mask
    let frame = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    let fgmask = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
    let fgbg = new cv.BackgroundSubtractorMOG2(history=500, varThreshold=40, detectShadows=false);

    const FPS = 30;
    const whitePixelRatioThreshold = 0.11; // Adjust this ratio threshold as needed

    function processVideo() {
        try {
            // Capture frame from video stream
            cap.read(frame);

            // Flip the frame horizontally
            cv.flip(frame, frame, 1); // flipCode = 1 for horizontal flip

            // Draw two outer red squares on the input frame
            let squareSize = 100; // Size of the square
            let spaceBetween = 5; // Space between squares (width)
            let spaceBetweenStacks = 50; // Space between the two stacks

            // Calculate the total width occupied by the two stacks
            let totalWidth = (2 * squareSize) + spaceBetweenStacks + spaceBetween;

            // Center the squares in the frame
            let startX = frame.cols / 2; 
            let bottomY = frame.rows - squareSize; // Position squares at the bottom

            // Draw the bottom blue squares
            offsetX = squareSize;
            topLeftValueX1 = startX + 0.20 * offsetX; //left corner blue right square
            topLeftValueX2 = startX - 1.20 * offsetX; //left corner blue left square

            bottomRightValueX1 = startX + 1.20 * offsetX; //right corner blue right square
            bottomRightValueX2 = startX - 0.20 * offsetX; //right corner blue left square

            bottomRight = new cv.Point(bottomRightValueX1, bottomY); //set bottom right coordinate for right square
            topLeft = new cv.Point(topLeftValueX1, bottomY + squareSize); //set top left coordinate for right square
            cv.rectangle(frame, topLeft, bottomRight, [0, 0, 255, 255], 2); //draw right square

            bottomRight = new cv.Point(bottomRightValueX2, bottomY); //set bottom right coordinate for left square
            topLeft = new cv.Point(topLeftValueX2, bottomY + squareSize); //set top left coordinate for left square
            cv.rectangle(frame, topLeft, bottomRight, [0, 0, 255, 255], 2); //draw left square


            // Draw the top green squares (offset the left one to the left and the right one to the right)
            topLeftValueX1 = startX + 1.5*offsetX;
            topLeftValueX2 = startX - 2.5*offsetX;

            bottomRightValueX1 = startX + 2.5*offsetX;
            bottomRightValueX2 = startX - 1.5*offsetX;

            bottomRight = new cv.Point(bottomRightValueX1, bottomY - 5);
            topLeft = new cv.Point(topLeftValueX1, bottomY - squareSize - 5);
            cv.rectangle(frame, topLeft, bottomRight, [0, 255, 0, 255], 2); // Draw in green

            bottomRight = new cv.Point(bottomRightValueX2, bottomY - 5);
            topLeft = new cv.Point(topLeftValueX2, bottomY - squareSize - 5);
            cv.rectangle(frame, topLeft, bottomRight, [0, 255, 0, 255], 2);

            // Define ROIs based on square coordinates
            const ROIs = {
                greenLeft: { topLeft: [video.width / 2 - 2.5 * offsetX, video.height - squareSize * 2 - 5], size: squareSize },
                greenRight: { topLeft: [video.width / 2 + 1.5 * offsetX, video.height - squareSize * 2 - 5], size: squareSize },
                blueLeft: { topLeft: [video.width / 2 - 1.2 * offsetX, video.height - squareSize], size: squareSize },
                blueRight: { topLeft: [video.width / 2 + 0.2 * offsetX, video.height - squareSize], size: squareSize }
            };

            // Apply background subtraction
            fgbg.apply(frame, fgmask);

            // Threshold the foreground mask to binarize the image
            cv.threshold(fgmask, fgmask, 150, 255, cv.THRESH_BINARY);

            // Display the modified frame with squares on the first canvas
            cv.imshow(canvasOutput, frame);
            // Display the foreground mask on the second canvas
            cv.imshow(canvasMask, fgmask);

            // Process each ROI
            for (const key in ROIs) {
                const { topLeft, size } = ROIs[key];
                const [x, y] = topLeft;

                // Define ROI rectangle
                let roi = fgmask.roi(new cv.Rect(x, y, size, size));
                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();

                // Count white pixels in ROI
                let whitePixels = cv.countNonZero(roi);
                let totalPixels = roi.rows * roi.cols;
                let whitePixelRatio = whitePixels / totalPixels;
                
                // Find contours in ROI
                cv.findContours(roi, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

                // Check if any contours are detected in ROI
                // Check if any contours are detected in ROI
                let objectDetectedContours = contours.size() > 10;
                let objectDetectedWhiteRatio = whitePixelRatio > whitePixelRatioThreshold;
                let objectDetected = objectDetectedContours && objectDetectedWhiteRatio;
                window.detectionStatus[key] = objectDetected; // Update global detection status object

                //console.log(`${key} object detected: ${objectDetected}`);

                // Draw rectangle on original frame based on detection status
                let color = objectDetected ? [0, 255, 255, 255] : [0, 0, 255, 255]; // Yellow for detection, blue otherwise
                cv.rectangle(frame, new cv.Point(x, y), new cv.Point(x + size, y + size), color, -1);

                // Clean up ROI processing Mats
                roi.delete();
                contours.delete();
                hierarchy.delete();
            }

            // Show the updated frame with colored boxes
            cv.imshow(canvasOutput, frame);

            // Schedule the next frame processing
            setTimeout(processVideo, 1000 / FPS);
        } catch (err) {
            console.error(err);
        }
    }

    // Start processing
    processVideo();
}

// Accessing Detection Status in Another File

// // Assuming this is running after onVideoLoaded() has started
// function checkDetectionStatus() {
//     console.log("Current detection status:", window.detectionStatus);

//     if (window.detectionStatus.greenLeft) {
//         console.log("Object detected in greenLeft ROI");
//     }
//     // Repeat checks for other ROIs as needed
// }

// // Call `checkDetectionStatus` as needed, or use setInterval to poll the status
// setInterval(checkDetectionStatus, 500); // Poll every 500ms, for example