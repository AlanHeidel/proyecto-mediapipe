import {
  FaceLandmarker,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export function resizeCanvasToVideo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) {
  const rect = video.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  if (!width || !height) {
    return;
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

export function drawFaceLandmarks(
  canvas: HTMLCanvasElement,
  result: FaceLandmarkerResult
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  result.faceLandmarks.forEach((landmarks) => {
    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_CONTOURS,
      "#FF8A1D",
      1.8
    );

    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      "#FFE7B0",
      1.3
    );

    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      "#FFE7B0",
      1.3
    );

    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
      "#FFF4DA",
      1.2
    );

    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
      "#FFF4DA",
      1.2
    );

    drawConnectors(
      context,
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      "rgba(255, 195, 113, 0.28)",
      1
    );
  });
}

function drawConnectors(
  context: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  connections: Array<{ start: number; end: number }>,
  strokeStyle: string,
  lineWidth: number
) {
  context.save();
  context.beginPath();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.lineJoin = "round";
  context.lineCap = "round";

  for (const connection of connections) {
    const start = landmarks[connection.start];
    const end = landmarks[connection.end];

    if (!start || !end) {
      continue;
    }

    context.moveTo(start.x * context.canvas.width, start.y * context.canvas.height);
    context.lineTo(end.x * context.canvas.width, end.y * context.canvas.height);
  }

  context.stroke();
  context.restore();
}
