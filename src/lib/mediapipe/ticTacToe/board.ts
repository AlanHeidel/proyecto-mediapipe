import type { Point, Rect } from "../shared/videoLayout";

export type TicTacToeMark = "x" | "o";
export type TicTacToeCell = TicTacToeMark | null;
export type TicTacToeBoard = TicTacToeCell[];

const BOARD_COLUMNS = 3;
const BOARD_CELLS = BOARD_COLUMNS * BOARD_COLUMNS;

export function createEmptyTicTacToeBoard(): TicTacToeBoard {
  return Array.from({ length: BOARD_CELLS }, () => null);
}

export function getNextTicTacToePlayer(
  currentPlayer: TicTacToeMark
): TicTacToeMark {
  return currentPlayer === "x" ? "o" : "x";
}

export function isTicTacToeBoardFull(board: TicTacToeBoard) {
  return board.every((cell) => cell !== null);
}

export function getTicTacToeBoardRect(videoRect: Rect): Rect {
  const size = Math.min(videoRect.width, videoRect.height) * 0.82;

  return {
    x: videoRect.x + (videoRect.width - size) / 2,
    y: videoRect.y + (videoRect.height - size) / 2,
    width: size,
    height: size,
  };
}

export function getTicTacToeCellIndexAtPoint(
  boardRect: Rect,
  point: Point
): number | null {
  if (
    point.x < boardRect.x ||
    point.x > boardRect.x + boardRect.width ||
    point.y < boardRect.y ||
    point.y > boardRect.y + boardRect.height
  ) {
    return null;
  }

  const cellSize = boardRect.width / BOARD_COLUMNS;
  const column = Math.min(
    BOARD_COLUMNS - 1,
    Math.floor((point.x - boardRect.x) / cellSize)
  );
  const row = Math.min(
    BOARD_COLUMNS - 1,
    Math.floor((point.y - boardRect.y) / cellSize)
  );

  return row * BOARD_COLUMNS + column;
}

export function getTicTacToeCellRect(boardRect: Rect, cellIndex: number): Rect {
  const cellSize = boardRect.width / BOARD_COLUMNS;
  const row = Math.floor(cellIndex / BOARD_COLUMNS);
  const column = cellIndex % BOARD_COLUMNS;

  return {
    x: boardRect.x + column * cellSize,
    y: boardRect.y + row * cellSize,
    width: cellSize,
    height: cellSize,
  };
}
