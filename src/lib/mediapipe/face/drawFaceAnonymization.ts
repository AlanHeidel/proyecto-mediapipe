import {
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const PIXELATION_DIVISOR = 30;
const BLUR_RADIUS_PX = 1;
const FACE_MASK_EXPANSION = 0.05;

type NormalizedPoint = {
  x: number;
  y: number;
};

let pixelationCanvas: HTMLCanvasElement | null = null;

export function drawFaceAnonymization(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  result: FaceLandmarkerResult
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  result.faceLandmarks.forEach((landmarks) => {
    pixelateFaceRegion(context, video, landmarks);
  });
}

function pixelateFaceRegion(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[]
) {
  const maskPoints = getExpandedFaceMaskPoints(landmarks);

  if (maskPoints.length < 3 || video.videoWidth <= 0 || video.videoHeight <= 0) {
    return;
  }

  const normalizedBounds = getNormalizedBounds(maskPoints);
  const paddingX = (normalizedBounds.maxX - normalizedBounds.minX) * 0.03;
  const paddingY = (normalizedBounds.maxY - normalizedBounds.minY) * 0.05;

  const sourceX = clamp(
    Math.floor((normalizedBounds.minX - paddingX) * video.videoWidth),
    0,
    video.videoWidth
  );
  const sourceY = clamp(
    Math.floor((normalizedBounds.minY - paddingY) * video.videoHeight),
    0,
    video.videoHeight
  );
  const sourceRight = clamp(
    Math.ceil((normalizedBounds.maxX + paddingX) * video.videoWidth),
    0,
    video.videoWidth
  );
  const sourceBottom = clamp(
    Math.ceil((normalizedBounds.maxY + paddingY) * video.videoHeight),
    0,
    video.videoHeight
  );
  const sourceWidth = sourceRight - sourceX;
  const sourceHeight = sourceBottom - sourceY;

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return;
  }

  const destinationX = (sourceX / video.videoWidth) * context.canvas.width;
  const destinationY = (sourceY / video.videoHeight) * context.canvas.height;
  const destinationWidth =
    (sourceWidth / video.videoWidth) * context.canvas.width;
  const destinationHeight =
    (sourceHeight / video.videoHeight) * context.canvas.height;

  const pixelCanvas = getPixelationCanvas();
  const pixelContext = pixelCanvas?.getContext("2d");

  if (!pixelCanvas || !pixelContext) {
    return;
  }

  const downsampleWidth = Math.max(
    1,
    Math.round(sourceWidth / PIXELATION_DIVISOR)
  );
  const downsampleHeight = Math.max(
    1,
    Math.round(sourceHeight / PIXELATION_DIVISOR)
  );

  pixelCanvas.width = downsampleWidth;
  pixelCanvas.height = downsampleHeight;

  pixelContext.clearRect(0, 0, downsampleWidth, downsampleHeight);
  pixelContext.imageSmoothingEnabled = true;
  pixelContext.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    downsampleWidth,
    downsampleHeight
  );

  const pathPoints = maskPoints.map((point) => ({
    x: point.x * context.canvas.width,
    y: point.y * context.canvas.height,
  }));

  context.save();
  context.beginPath();
  context.moveTo(pathPoints[0].x, pathPoints[0].y);

  for (let index = 1; index < pathPoints.length; index += 1) {
    context.lineTo(pathPoints[index].x, pathPoints[index].y);
  }

  context.closePath();
  context.clip();
  context.imageSmoothingEnabled = false;
  context.filter = `blur(${BLUR_RADIUS_PX}px)`;
  context.drawImage(
    pixelCanvas,
    0,
    0,
    downsampleWidth,
    downsampleHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight
  );
  context.filter = "none";
  context.restore();
}

function getExpandedFaceMaskPoints(landmarks: NormalizedLandmark[]) {
  const points = landmarks.map((landmark) => ({
    x: landmark.x,
    y: landmark.y,
  }));
  const convexHull = getConvexHull(points);

  if (convexHull.length < 3) {
    return [];
  }

  const center = getPolygonCenter(convexHull);

  return convexHull.map((point) => {
    const deltaX = point.x - center.x;
    const deltaY = point.y - center.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;

    return {
      x: clamp(point.x + (deltaX / distance) * FACE_MASK_EXPANSION, 0, 1),
      y: clamp(point.y + (deltaY / distance) * FACE_MASK_EXPANSION, 0, 1),
    };
  });
}

function getNormalizedBounds(points: NormalizedPoint[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );
}

function getConvexHull(points: NormalizedPoint[]) {
  if (points.length <= 3) {
    return points;
  }

  const sortedPoints = [...points].sort((pointA, pointB) => {
    if (pointA.x === pointB.x) {
      return pointA.y - pointB.y;
    }

    return pointA.x - pointB.x;
  });

  const lowerHull: NormalizedPoint[] = [];

  for (const point of sortedPoints) {
    while (
      lowerHull.length >= 2 &&
      getCrossProduct(
        lowerHull[lowerHull.length - 2],
        lowerHull[lowerHull.length - 1],
        point
      ) <= 0
    ) {
      lowerHull.pop();
    }

    lowerHull.push(point);
  }

  const upperHull: NormalizedPoint[] = [];

  for (let index = sortedPoints.length - 1; index >= 0; index -= 1) {
    const point = sortedPoints[index];

    while (
      upperHull.length >= 2 &&
      getCrossProduct(
        upperHull[upperHull.length - 2],
        upperHull[upperHull.length - 1],
        point
      ) <= 0
    ) {
      upperHull.pop();
    }

    upperHull.push(point);
  }

  lowerHull.pop();
  upperHull.pop();

  return [...lowerHull, ...upperHull];
}

function getPolygonCenter(points: NormalizedPoint[]) {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function getCrossProduct(
  origin: NormalizedPoint,
  pointA: NormalizedPoint,
  pointB: NormalizedPoint
) {
  return (
    (pointA.x - origin.x) * (pointB.y - origin.y) -
    (pointA.y - origin.y) * (pointB.x - origin.x)
  );
}

function getPixelationCanvas() {
  if (typeof document === "undefined") {
    return null;
  }

  if (!pixelationCanvas) {
    pixelationCanvas = document.createElement("canvas");
  }

  return pixelationCanvas;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
