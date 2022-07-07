import * as Controls from "../types/control_utils";
import type * as DrawingUtils from "../types/drawing_utils";

import type * as MPPose from "../types/pose";
import type * as MathType from "../types/math";
import type { LandmarkGrid as LandmarkGridType } from "../types/control_utils_3d";


const math = globalThis.math as typeof MathType;
const controls = window as unknown as typeof Controls;
const LandmarkGrid = (window as any).LandmarkGrid as typeof LandmarkGridType;
const drawingUtils = window as unknown as typeof DrawingUtils;
const mpPose = window as unknown as typeof MPPose;

const options = {
  locateFile: (file: any) =>
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

const grid2 = new LandmarkGrid(landmarkContainer, {
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

function landmark_to_matrix(lm: MPPose.Landmark)
{
  const mat = math.matrix([lm.x, lm.y, lm.z]);

  return mat;
}

function landmark_list_to_matrix(lm_list: MPPose.LandmarkList)
{
  let mat = [];
  lm_list.forEach(lm =>
  {
    mat.push([lm.x, lm.y, lm.z]);
  });
  return mat;
}

function landmark_matrix_to_list(lm_mat: MathType.Matrix, lm_list: MPPose.LandmarkList)
{
  let new_lm_list: MPPose.LandmarkList = [];
  for (let index = 0; index < lm_list.length; index++)
  {

    let x = lm_mat.get([index, 0]);
    let y = lm_mat.get([index, 1]);
    let z = lm_mat.get([index, 2]);
    new_lm_list.push({ x: x, y: y, z: z, visibility: lm_list[index].visibility });
  }
  return new_lm_list;
}


function get_angle(lm: MPPose.LandmarkList)
{
  let left = false;
  let hip: MPPose.Landmark, shoulder: MPPose.Landmark;
  if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z)
  {
    left = true;
    hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
    shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
  }
  else
  {
    hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
    shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
  }
  let x_diff = Math.abs(shoulder.x - hip.x);
  let y_diff = Math.abs(shoulder.y - hip.y);
  let z_diff = Math.abs(shoulder.z - hip.z);
  let x_vect = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
  let y_vect = Math.sqrt(Math.pow(y_diff, 2) + Math.pow(z_diff, 2));

  let angle = Math.atan2(y_vect, x_vect) * 180 / Math.PI;
  //  let angle = Math.atan2(y x_vect) * 180 / Math.PI;

  return { angle, left };
}

function get_angle2d(lm: MPPose.LandmarkList, width: number, height: number)
{
  let left = false;
  let hip: MPPose.Landmark, shoulder: MPPose.Landmark;
  if (lm[mpPose.POSE_LANDMARKS.LEFT_HIP].z <= lm[mpPose.POSE_LANDMARKS.RIGHT_HIP].z)
  {
    left = true;
    hip = lm[mpPose.POSE_LANDMARKS.LEFT_HIP];
    shoulder = lm[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
  }
  else
  {
    hip = lm[mpPose.POSE_LANDMARKS.RIGHT_HIP];
    shoulder = lm[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
  }
  let x_diff = Math.abs(shoulder.x - hip.x) * width;
  let y_diff = Math.abs(shoulder.y - hip.y) * height;
  let angle = Math.atan2(y_diff, x_diff) * 180 / Math.PI;
  return { angle, left };
}


function filter_landmarks(idx: number[], landmarks: MPPose.Landmark[])
{
  return landmarks.map((lm: MPPose.Landmark, i: number) =>
  {
    if (!idx.includes(i))
    {
      lm.visibility = 0;
    }
    return lm;
  }
  );
}

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
  let left = false;
  let idx = [];
  if (results.poseWorldLandmarks)
  {

    let res = get_angle(results.poseWorldLandmarks);


    let mat = landmark_to_matrix(results.poseWorldLandmarks[0]);
    left = res.left;
    console.log("angle: " + res.angle);
    console.log("2d angle: " + get_angle2d(results.poseLandmarks, results.image.width, results.image.height).angle);

    let near_shoulder, far_shoulder;
    if (res.left)
    {
      idx = Object.values(mpPose.POSE_LANDMARKS_LEFT);
      near_shoulder = results.poseWorldLandmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
      far_shoulder = results.poseWorldLandmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
    }
    else
    {
      idx = Object.values(mpPose.POSE_LANDMARKS_RIGHT);
      near_shoulder = results.poseWorldLandmarks[mpPose.POSE_LANDMARKS.RIGHT_SHOULDER];
      far_shoulder = results.poseWorldLandmarks[mpPose.POSE_LANDMARKS.LEFT_SHOULDER];
    }
    near_shoulder = landmark_to_matrix(near_shoulder);
    far_shoulder = landmark_to_matrix(far_shoulder);
    let vect_real = math.subtract(near_shoulder, far_shoulder);
    let vect_ideal = math.matrix([0, 0, vect_real.get([2])]);

    let x = vect_real.get([0]);
    let z = -vect_real.get([2]);
    // let y = vect_ideal[1] - vect_real[1];
    let rot_y = -Math.atan2(x, z);
    console.log(`rotation: ${rot_y * 180 / Math.PI}`);
    // let rot_x = Math.atan2(y, Math.hypot(x, z));

    let cos = Math.cos(rot_y);
    let sin = Math.sin(rot_y);
    let trans_matrix = math.matrix([
      [cos, 0, sin],
      [0, 1, 0],
      [-sin, 0, cos]
    ]);
    let lm_mat = landmark_list_to_matrix(results.poseWorldLandmarks);
    lm_mat = math.multiply(lm_mat, trans_matrix);



    let landmarks = filter_landmarks(idx, results.poseWorldLandmarks);
    let landmarks_rotated = landmark_matrix_to_list(lm_mat, results.poseWorldLandmarks);

    grid.updateLandmarks(landmarks, mpPose.POSE_CONNECTIONS, [
      { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
      { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
    ]);
    grid2.updateLandmarks(landmarks_rotated, mpPose.POSE_CONNECTIONS, [
      { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
      { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
    ]);
  }
  else
  {
    grid.updateLandmarks([]);
    grid2.updateLandmarks([]);

  }

  if (results.poseLandmarks)
  {
    drawingUtils.drawConnectors(
      canvasCtx, filter_landmarks(idx, results.poseLandmarks), mpPose.POSE_CONNECTIONS,
      { visibilityMin: 0.65, color: 'white' });
    if (left)
    {
      drawingUtils.drawLandmarks(
        canvasCtx,
        Object.values(mpPose.POSE_LANDMARKS_LEFT)
          .map(index => results.poseLandmarks[index]),
        { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
    }
    else
    {
      drawingUtils.drawLandmarks(
        canvasCtx,
        Object.values(mpPose.POSE_LANDMARKS_RIGHT)
          .map(index => results.poseLandmarks[index]),
        { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
    }
    drawingUtils.drawLandmarks(
      canvasCtx,
      Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
        .map(index => results.poseLandmarks[index]),
      { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
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
    activeEffect = (x as { [key: string]: string; })['effect'];
    pose.setOptions(options);
  });
