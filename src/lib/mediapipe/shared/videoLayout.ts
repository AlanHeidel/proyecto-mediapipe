import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getContainedVideoRect(
  containerWidth: number,
  containerHeight: number,
  sourceWidth: number,
  sourceHeight: number
): Rect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const containerAspectRatio = containerWidth / containerHeight;
  const sourceAspectRatio = sourceWidth / sourceHeight;

  if (containerAspectRatio > sourceAspectRatio) {
    const height = containerHeight;
    const width = height * sourceAspectRatio;

    return {
      x: (containerWidth - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  const width = containerWidth;
  const height = width / sourceAspectRatio;

  return {
    x: 0,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function projectNormalizedLandmarkToRect(
  landmark: NormalizedLandmark,
  rect: Rect
): Point {
  return {
    x: rect.x + clamp(landmark.x, 0, 1) * rect.width,
    y: rect.y + clamp(landmark.y, 0, 1) * rect.height,
  };
}

export function getDistanceBetweenPoints(pointA: Point, pointB: Point) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
