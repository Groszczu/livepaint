import { bytesToShort, shortToBytes } from './binary';
import type { Dimensions } from './drawing';

export interface Point {
  x: number;
  y: number;
}

const NORMALIZATION_RESOLUTION = 2 ** 16 - 1;

export function normalizePoint(point: Point, canvasDimensions: Dimensions) {
  return {
    x: (point.x / canvasDimensions.width) * NORMALIZATION_RESOLUTION,
    y: (point.y / canvasDimensions.height) * NORMALIZATION_RESOLUTION,
  };
}

export function denormalizePoint(point: Point, canvasDimensions: Dimensions) {
  return {
    x: (point.x * canvasDimensions.width) / NORMALIZATION_RESOLUTION,
    y: (point.y * canvasDimensions.height) / NORMALIZATION_RESOLUTION,
  };
}

export function pointToCoords(point: Point) {
  return [point.x, point.y];
}

export function pointsToCoordsArray(points: Point[]) {
  return points.flatMap(pointToCoords);
}

export function pointsToBytes(points: Point[]) {
  return pointsToCoordsArray(points).flatMap(shortToBytes);
}

export function bytesToPoints(bytes: number[]) {
  const points: Point[] = [];

  const bytesPerPoint = 4;
  for (let i = 0; i < bytes.length; i += bytesPerPoint) {
    const [xMsb, xLsb, yMsb, yLsb] = bytes.slice(i, i + bytesPerPoint);
    points.push({
      x: bytesToShort([xMsb, xLsb]),
      y: bytesToShort([yMsb, yLsb]),
    });
  }

  return points;
}
