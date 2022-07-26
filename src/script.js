var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { landmark_to_matrix } from "./helpers.js";
import { get_angle2d, filter_landmarks, is_left_close } from "./angle.js";
const math = globalThis.math;
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
        left = is_left_close(mpPose, results.poseLandmarks);
        // console.log("2d angle: " + get_angle2d(results.poseLandmarks, results.image.width, results.image.height).angle);
        if (left) {
            idx = Object.values(mpPose.POSE_LANDMARKS_LEFT);
        }
        else {
            idx = Object.values(mpPose.POSE_LANDMARKS_RIGHT);
        }
        let near_hip = left ? landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.LEFT_HIP]) : landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.RIGHT_HIP]);
        let near_shoulder = left ? landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER]) : landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER]);
        let vect_hip_shoulder = math.abs(math.subtract(near_shoulder, near_hip));
        let torso_angle = get_angle2d(vect_hip_shoulder, math.matrix([0, 0, 0]), results.image.width, results.image.height);
        let near_elbow = left ? landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.LEFT_ELBOW]) : landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.RIGHT_ELBOW]);
        let vect_shoulder_elbow = math.subtract(near_elbow, near_shoulder);
        vect_shoulder_elbow.subset(math.index(0), math.abs(vect_shoulder_elbow.get([0])));
        let shoulder_angle = get_angle2d(vect_shoulder_elbow, math.subtract(math.matrix([0, 0, 0]), vect_hip_shoulder), results.image.width, results.image.height);
        let near_wrist = left ? landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.LEFT_WRIST]) : landmark_to_matrix(math, results.poseLandmarks[mpPose.POSE_LANDMARKS.RIGHT_WRIST]);
        let vect_elbow_wrist = math.subtract(near_wrist, near_elbow);
        vect_elbow_wrist.subset(math.index(0), math.abs(vect_elbow_wrist.get([0])));
        let elbow_angle = get_angle2d(math.subtract(math.matrix([0, 0, 0]), vect_shoulder_elbow), vect_elbow_wrist, results.image.width, results.image.height);
        console.log(`torso: ${torso_angle}, shoulder: ${shoulder_angle}, elbow: ${elbow_angle}`);
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
    selfieMode: false,
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
//# sourceMappingURL=script.js.map