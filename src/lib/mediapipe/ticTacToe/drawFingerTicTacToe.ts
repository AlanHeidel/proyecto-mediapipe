import type { Point, Rect } from "../shared/videoLayout";
import {
  getTicTacToeCellRect,
  type TicTacToeBoard,
} from "./board";

type DrawFingerTicTacToeOptions = {
  board: TicTacToeBoard;
  boardRect: Rect;
  hoveredCellIndex: number | null;
  indexTipPoint: Point | null;
  thumbTipPoint: Point | null;
  isPinching: boolean;
};

export function drawFingerTicTacToe(
  canvas: HTMLCanvasElement,
  {
    board,
    boardRect,
    hoveredCellIndex,
    indexTipPoint,
    thumbTipPoint,
    isPinching,
  }: DrawFingerTicTacToeOptions
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (boardRect.width <= 0 || boardRect.height <= 0) {
    return;
  }

  drawBoardBackground(context, boardRect);

  if (hoveredCellIndex !== null) {
    drawHoveredCell(context, boardRect, hoveredCellIndex);
  }

  drawGrid(context, boardRect);
  drawMarks(context, boardRect, board);
  drawFingerPointers(context, indexTipPoint, thumbTipPoint, isPinching);
}

function drawBoardBackground(context: CanvasRenderingContext2D, boardRect: Rect) {
  context.save();
  context.fillStyle = "rgba(8, 15, 28, 0.4)";
  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.lineWidth = 1.5;
  drawRoundedRectPath(context, boardRect.x, boardRect.y, boardRect.width, boardRect.height, 26);
  context.fill();
  context.stroke();
  context.restore();
}

function drawHoveredCell(
  context: CanvasRenderingContext2D,
  boardRect: Rect,
  hoveredCellIndex: number
) {
  const hoveredCellRect = getTicTacToeCellRect(boardRect, hoveredCellIndex);

  context.save();
  context.fillStyle = "rgba(255, 138, 29, 0.18)";
  context.fillRect(
    hoveredCellRect.x,
    hoveredCellRect.y,
    hoveredCellRect.width,
    hoveredCellRect.height
  );
  context.restore();
}

function drawGrid(context: CanvasRenderingContext2D, boardRect: Rect) {
  const cellSize = boardRect.width / 3;
  const lineWidth = Math.max(2.4, boardRect.width * 0.008);

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.88)";
  context.lineWidth = lineWidth;
  context.lineCap = "round";

  for (let index = 1; index < 3; index += 1) {
    const x = boardRect.x + cellSize * index;
    const y = boardRect.y + cellSize * index;

    context.beginPath();
    context.moveTo(x, boardRect.y + 10);
    context.lineTo(x, boardRect.y + boardRect.height - 10);
    context.stroke();

    context.beginPath();
    context.moveTo(boardRect.x + 10, y);
    context.lineTo(boardRect.x + boardRect.width - 10, y);
    context.stroke();
  }

  context.restore();
}

function drawMarks(
  context: CanvasRenderingContext2D,
  boardRect: Rect,
  board: TicTacToeBoard
) {
  board.forEach((mark, cellIndex) => {
    if (!mark) {
      return;
    }

    const cellRect = getTicTacToeCellRect(boardRect, cellIndex);

    if (mark === "x") {
      drawX(context, cellRect);
      return;
    }

    drawO(context, cellRect);
  });
}

function drawX(context: CanvasRenderingContext2D, cellRect: Rect) {
  const padding = cellRect.width * 0.24;

  context.save();
  context.strokeStyle = "#60A5FA";
  context.lineWidth = Math.max(4, cellRect.width * 0.075);
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(cellRect.x + padding, cellRect.y + padding);
  context.lineTo(
    cellRect.x + cellRect.width - padding,
    cellRect.y + cellRect.height - padding
  );
  context.moveTo(cellRect.x + cellRect.width - padding, cellRect.y + padding);
  context.lineTo(cellRect.x + padding, cellRect.y + cellRect.height - padding);
  context.stroke();
  context.restore();
}

function drawO(context: CanvasRenderingContext2D, cellRect: Rect) {
  const radius = cellRect.width * 0.28;

  context.save();
  context.strokeStyle = "#F97316";
  context.lineWidth = Math.max(4, cellRect.width * 0.075);
  context.beginPath();
  context.arc(
    cellRect.x + cellRect.width / 2,
    cellRect.y + cellRect.height / 2,
    radius,
    0,
    Math.PI * 2
  );
  context.stroke();
  context.restore();
}

function drawFingerPointers(
  context: CanvasRenderingContext2D,
  indexTipPoint: Point | null,
  thumbTipPoint: Point | null,
  isPinching: boolean
) {
  if (indexTipPoint && thumbTipPoint) {
    context.save();
    context.strokeStyle = isPinching
      ? "rgba(34, 197, 94, 0.9)"
      : "rgba(255, 255, 255, 0.5)";
    context.lineWidth = isPinching ? 4 : 2.4;
    context.beginPath();
    context.moveTo(indexTipPoint.x, indexTipPoint.y);
    context.lineTo(thumbTipPoint.x, thumbTipPoint.y);
    context.stroke();
    context.restore();
  }

  if (thumbTipPoint) {
    drawPointerDot(context, thumbTipPoint, 10, "#38BDF8");
  }

  if (indexTipPoint) {
    drawPointerDot(context, indexTipPoint, 12, "#FF8A1D");
  }
}

function drawPointerDot(
  context: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  color: string
) {
  context.save();
  context.fillStyle = color;
  context.shadowColor = `${color}66`;
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawRoundedRectPath(
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
