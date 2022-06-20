import * as THREE from "three"

/**
 * @fileoverview This module provides types for normalized landmarks and the
 * LandmarkGrid widget.
 */

/**
 * Represents a single normalized landmark.
 */
export declare interface NormalizedLandmark
{
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * ViewerWidget configuration
 */
export interface ViewerWidgetConfig
{
  backgroundColor?: number;
  fovInDegrees?: number;
  isRotating?: boolean;
  rotationSpeed?: number;
}

/**
 * Configuration for the landmark grid.
 */
interface LandmarkGridConfig extends ViewerWidgetConfig
{
  axesColor?: number;
  axesWidth?: number;
  /**
   * The "centered" attribute describes whether the grid should use the center
   * of the bounding box of the landmarks as the origin.
   */
  centered?: boolean;
  connectionColor?: number;
  connectionWidth?: number;
  definedColors?: Array<{ name: string; value: number; }>;
  /**
   * The "fitToGrid" attribute describes whether the grid should dynamically
   * resize based on the landmarks given.
   */
  fitToGrid?: boolean;
  labelPrefix?: string;
  labelSuffix?: string;
  landmarkColor?: number;
  landmarkSize?: number;
  margin?: number;
  minVisibility?: number;
  nonvisibleLandmarkColor?: number;
  numCellsPerAxis?: number;
  /**
   * The "range" attribue describes the default numerical boundaries of the
   * grid. The grid ranges from [-range, range] on every axis.
   */
  range?: number;
  showHidden?: boolean;
}

/**
 * A connection between two landmarks
 */
type Connection = number[];

/**
 * A list of connections between landmarks
 */
type ConnectionList = Connection[];

/**
 * Name for a color
 */
type ColorName = Exclude<string, ''>;

/**
 * An interface for specifying colors for lists (e.g. landmarks and connections)
 */
type ColorMap<T> = Array<{ color: ColorName | undefined; list: T[] }>;

/**
 * Base class for 3D viewing widgets
 */
export class ViewerWidget
{
  setDistance(distance: number): void;
}

/**
 * Provides a 3D grid that is rendered onto a canvas where landmarks and
 * connections can be drawn.
 */
export class LandmarkGrid extends ViewerWidget
{
  constructor(parent: HTMLElement, config?: LandmarkGridConfig);
  updateLandmarks(
    landmarks: NormalizedLandmark[],
    colorConnections?: ConnectionList | ColorMap<Connection>,
    colorLandmarks?: ColorMap<number>): void;
}

/**
 * Configuration object for MeshViewer
 */
export interface MeshViewerConfig extends ViewerWidgetConfig
{
  materialColor?: number;
  texture?: string | null;
}

/**
 * A viewer widget for meshes with or without textures
 */
export class MeshViewer extends ViewerWidget
{
  constructor(parent: HTMLElement, config?: MeshViewerConfig);
  updateMeshFromLandmarks(
    landmarks: NormalizedLandmark[], faces: ArrayLike<number>,
    textureCoords?: ArrayLike<number>): void;
  updateMeshFromData(
    landmarks: ArrayLike<number>, faces: ArrayLike<number>,
    textureCoords?: ArrayLike<number>): void;
  updateMesh(mesh: THREE.Mesh): void;
  setTexture(url: string): void;
}

/**
 * Converts a landmark into a homogenous column vector.
 */
export function landmarkToColumnVector(landmark: NormalizedLandmark):
  number[][];

/**
 * Converts a column vector to a Normalized Landmark.
 */
export function columnVectorToLandmark(v: number[][]): NormalizedLandmark;

/**
 * Given a set of points, a transform matrix, and a projection matrix, returns a
 * list of landmarks in normalized device coordinates (NDC).
 */
export function convertToNDC(
  vectors: number[][] | NormalizedLandmark[], transform: number[][],
  projection: number[][]): NormalizedLandmark[];

/**
 * Multiplies two number matrices together and returns the result.
 */
export function matrixMultiply(a: number[][], b: number[][]): number[][];

/**
 * Makes a projection matrix for a perspective camera from a set of parameters.
 */
export function makeProjectionMatrix(
  fov: number, near: number, far: number, aspectRatio?: number): number[][];

/**
 * Results object for extractFromXYZUVArray
 */
export interface ExtractionResultsXYZUV
{
  textureCoords: number[];
  vertexCoords: number[][];
}

/**
 * Extracts a positional vector list and a texture array from a flat array.
 */
export function extractFromXYZUVArray(buffer: ArrayLike<number>):
  ExtractionResultsXYZUV;
