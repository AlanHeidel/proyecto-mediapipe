import {
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export function drawHandLandmarks(
  canvas: HTMLCanvasElement,
  result: HandLandmarkerResult
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  result.landmarks.forEach((landmarks, index) => {
    const handedness = result.handedness[index]?.[0]?.categoryName ?? "";
    const isLeftHand = handedness.toLowerCase() === "left";

    drawConnectors(
      context,
      landmarks,
      HandLandmarker.HAND_CONNECTIONS,
      isLeftHand ? "#7DD3FC" : "#FDE68A",
      2.2
    );

    drawLandmarks(
      context,
      landmarks,
      isLeftHand ? "#38BDF8" : "#F59E0B"
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

    context.moveTo(
      start.x * context.canvas.width,
      start.y * context.canvas.height
    );
    context.lineTo(end.x * context.canvas.width, end.y * context.canvas.height);
  }

  context.stroke();
  context.restore();
}

function drawLandmarks(
  context: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  fillStyle: string
) {
  context.save();
  context.fillStyle = fillStyle;

  landmarks.forEach((landmark, index) => {
    const radius = index === 4 || index === 8 ? 5 : 3.4;
    const x = landmark.x * context.canvas.width;
    const y = landmark.y * context.canvas.height;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}
