var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const controls = window;
const LandmarkGrid = window.LandmarkGrid;
const drawingUtils = window;
const mpPose = window;
const options = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
    }
};
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer, {
    connectionColor: 0xCCCCCC,
    definedColors: [{ name: 'LEFT', value: 0xffa500 }, { name: 'RIGHT', value: 0x00ffff }],
    range: 2,
    fitToGrid: true,
    labelSuffix: 'm',
    landmarkSize: 2,
    numCellsPerAxis: 4,
    showHidden: false,
    centered: true,
});
function get_angle(lm) {
    let left = false;
    let hip, shoulder;
    if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z) {
        left = true;
        hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
        shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
    }
    else {
        hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
        shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
    }
    let x_diff = Math.abs(shoulder.x) - hip.x;
    let y_diff = Math.abs(shoulder.y) - hip.y;
    let z_diff = Math.abs(shoulder.z) - hip.z;
    let x_vect = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
    let y_vect = Math.sqrt(Math.pow(y_diff, 2) + Math.pow(z_diff, 2));
    let angle = Math.atan2(y_vect, x_vect) * 180 / Math.PI;
    return { angle, left };
}
function get_angle2d(lm, width, height) {
    let left = false;
    let hip, shoulder;
    if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z) {
        left = true;
        hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
        shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
    }
    else {
        hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
        shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
    }
    let x_diff = Math.abs(Math.abs(shoulder.x) - hip.x) * width;
    let y_diff = Math.abs(Math.abs(shoulder.y) - hip.y) * height;
    let angle = Math.atan2(y_diff, x_diff) * 180 / Math.PI;
    return { angle, left };
}
function filter_landmarks(idx, landmarks) {
    return landmarks.map((lm, i) => {
        if (!idx.includes(i)) {
            lm.visibility = 0;
        }
        return lm;
    });
}
let activeEffect = 'mask';
function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();
    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.segmentationMask) {
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
        // Only overwrite existing pixels.
        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in';
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    }
    else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }
    let left = false;
    let idx = [];
    if (results.poseWorldLandmarks) {
        let res = get_angle(results.poseWorldLandmarks);
        left = res.left;
        console.log("3d angle: " + res.angle);
        console.log("2d angle: " + get_angle2d(results.poseLandmarks, results.image.width, results.image.height).angle);
        if (res.left) {
            idx = Object.values(mpPose.POSE_LANDMARKS_LEFT);
        }
        else {
            idx = Object.values(mpPose.POSE_LANDMARKS_RIGHT);
        }
        let landmarks = filter_landmarks(idx, results.poseWorldLandmarks);
        grid.updateLandmarks(landmarks, mpPose.POSE_CONNECTIONS, [
            { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
            { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
        ]);
    }
    else {
        grid.updateLandmarks([]);
    }
    if (results.poseLandmarks) {
        drawingUtils.drawConnectors(canvasCtx, filter_landmarks(idx, results.poseLandmarks), mpPose.POSE_CONNECTIONS, { visibilityMin: 0.65, color: 'white' });
        if (left) {
            drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_LEFT)
                .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
        }
        else {
            drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_RIGHT)
                .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
        }
        drawingUtils.drawLandmarks(canvasCtx, Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
    }
    canvasCtx.restore();
}
// const pose = new mpPose.Pose(options);
const pose = new mpPose.Pose(options);
pose.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    effect: 'background',
})
    .add([
    new controls.StaticText({ title: 'MediaPipe Pose' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            // Resets because this model gives better results when reset between
            // source changes.
            pose.reset();
        },
        onFrame: (input, size) => __awaiter(void 0, void 0, void 0, function* () {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            yield pose.send({ image: input });
        }),
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
    new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Effect',
        field: 'effect',
        discrete: { 'background': 'Background', 'mask': 'Foreground' },
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = x['effect'];
    pose.setOptions(options);
});
export {};
//# sourceMappingURL=script.js.map