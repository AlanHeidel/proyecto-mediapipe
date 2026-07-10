import {
  type Category,
  type Detection,
  type ObjectDetectorResult,
} from "@mediapipe/tasks-vision";

const DETECTION_COLORS = ["#FF8A1D", "#38BDF8", "#F472B6", "#A3E635", "#FACC15"];

type SourceSize = {
  height: number;
  width: number;
};

export function drawObjectDetections(
  canvas: HTMLCanvasElement,
  result: ObjectDetectorResult,
  sourceSize: SourceSize
) {
  const context = canvas.getContext("2d");

  if (!context || sourceSize.width <= 0 || sourceSize.height <= 0) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  result.detections.forEach((detection, index) => {
    drawDetection(context, detection, sourceSize, index);
  });
}

function drawDetection(
  context: CanvasRenderingContext2D,
  detection: Detection,
  sourceSize: SourceSize,
  index: number
) {
  const boundingBox = detection.boundingBox;
  const primaryCategory = detection.categories[0];

  if (!boundingBox || !primaryCategory) {
    return;
  }

  const color = DETECTION_COLORS[index % DETECTION_COLORS.length];
  const scaleX = context.canvas.width / sourceSize.width;
  const scaleY = context.canvas.height / sourceSize.height;
  const x = boundingBox.originX * scaleX;
  const y = boundingBox.originY * scaleY;
  const width = boundingBox.width * scaleX;
  const height = boundingBox.height * scaleY;
  const label = formatDetectionLabel(primaryCategory);

  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.shadowColor = `${color}55`;
  context.shadowBlur = 16;
  context.strokeRect(x, y, width, height);
  context.restore();

  drawLabel(context, color, label, x, y);
}

function drawLabel(
  context: CanvasRenderingContext2D,
  color: string,
  label: string,
  x: number,
  y: number
) {
  const fontSize = 14;
  const horizontalPadding = 10;
  const verticalPadding = 7;

  context.save();
  context.font = `600 ${fontSize}px sans-serif`;
  context.textBaseline = "middle";

  const textWidth = context.measureText(label).width;
  const boxWidth = textWidth + horizontalPadding * 2;
  const boxHeight = fontSize + verticalPadding * 2;
  const boxX = Math.max(0, Math.min(x, context.canvas.width - boxWidth));
  const preferredY = y - boxHeight - 8;
  const boxY = preferredY >= 0 ? preferredY : Math.min(y + 8, context.canvas.height - boxHeight);

  context.fillStyle = `${color}E6`;
  roundRect(context, boxX, boxY, boxWidth, boxHeight, 12);
  context.fill();

  context.fillStyle = "#fffaf5";
  context.fillText(
    label,
    boxX + horizontalPadding,
    boxY + boxHeight / 2
  );
  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function formatDetectionLabel(category: Category) {
  const rawLabel =
    category.displayName?.trim() ||
    category.categoryName?.trim() ||
    "Object";
  const score = Math.round((category.score ?? 0) * 100);

  return `${toTitleCase(rawLabel)} ${score}%`;
}

function toTitleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
