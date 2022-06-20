import * as Controls from "../types/control_utils"
import type * as DrawingUtils from "../types/drawing_utils"

import type * as MPPose from "../types/pose"
import type { LandmarkGrid as LandmarkGridType } from "../types/control_utils_3d"



const controls = window as unknown as typeof Controls;
const LandmarkGrid = (window as any).LandmarkGrid as typeof LandmarkGridType;
const drawingUtils = window as unknown as typeof DrawingUtils;
const mpPose = window as unknown as typeof MPPose;

const options = {
  locateFile: (file) =>
  {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
  }
};

// Our input frames will come from here.
const videoElement =
  document.getElementsByClassName('input_video')[0] as HTMLVideoElement;
const canvasElement =
  document.getElementsByClassName('output_canvas')[0] as HTMLCanvasElement;
const controlsElement =
  document.getElementsByClassName('control-panel')[0] as HTMLDivElement;
const canvasCtx = canvasElement.getContext('2d')!;

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading')! as HTMLDivElement;
spinner.ontransitionend = () =>
{
  spinner.style.display = 'none';
};

const landmarkContainer =
  document.getElementsByClassName('landmark-grid-container')[0] as HTMLDivElement;
const grid = new LandmarkGrid(landmarkContainer, {
  connectionColor: 0xCCCCCC,
  definedColors:
    [{ name: 'LEFT', value: 0xffa500 }, { name: 'RIGHT', value: 0x00ffff }],
  range: 2,
  fitToGrid: true,
  labelSuffix: 'm',
  landmarkSize: 2,
  numCellsPerAxis: 4,
  showHidden: false,
  centered: true,
});

let activeEffect = 'mask';
function onResults(results: MPPose.Results): void
{
  // Hide the spinner.
  document.body.classList.add('loaded');

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.segmentationMask)
  {
    canvasCtx.drawImage(
      results.segmentationMask, 0, 0, canvasElement.width,
      canvasElement.height);

    // Only overwrite existing pixels.
    if (activeEffect === 'mask' || activeEffect === 'both')
    {
      canvasCtx.globalCompositeOperation = 'source-in';
      // This can be a color or a texture or whatever...
      canvasCtx.fillStyle = '#00FF007F';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    } else
    {
      canvasCtx.globalCompositeOperation = 'source-out';
      canvasCtx.fillStyle = '#0000FF7F';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    }

    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
  } else
  {
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  if (results.poseLandmarks)
  {
    drawingUtils.drawConnectors(
      canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS,
      { visibilityMin: 0.65, color: 'white' });
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_LEFT)
        .map(index => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_RIGHT)
        .map(index => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
        .map(index => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
  }
  canvasCtx.restore();

  if (results.poseWorldLandmarks)
  {
    grid.updateLandmarks(results.poseWorldLandmarks, mpPose.POSE_CONNECTIONS, [
      { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
      { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
    ]);
  } else
  {
    grid.updateLandmarks([]);
  }
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
      onSourceChanged: () =>
      {
        // Resets because this model gives better results when reset between
        // source changes.
        pose.reset();
      },
      onFrame:
        async (input: Controls.InputImage, size: Controls.Rectangle) =>
        {
          const aspect = size.height / size.width;
          let width: number, height: number;
          if (window.innerWidth > window.innerHeight)
          {
            height = window.innerHeight;
            width = height / aspect;
          } else
          {
            width = window.innerWidth;
            height = width * aspect;
          }
          canvasElement.width = width;
          canvasElement.height = height;
          await pose.send({ image: input });
        },
    }),
    new controls.Slider({
      title: 'Model Complexity',
      field: 'modelComplexity',
      discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle(
      { title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Toggle(
      { title: 'Enable Segmentation', field: 'enableSegmentation' }),
    new controls.Toggle(
      { title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
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
  .on(x =>
  {
    const options = x as MPPose.Options;
    videoElement.classList.toggle('selfie', options.selfieMode);
    activeEffect = (x as { [key: string]: string })['effect'];
    pose.setOptions(options);
  });
