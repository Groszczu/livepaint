import { bytesToShort, shortToBytes } from './binary';

export interface Point {
  x: number;
  y: number;
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
