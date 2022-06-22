import type { Point } from './point';
import { pointsToCoordsArray } from './point';

export interface Dimensions {
  width: number;
  height: number;
}

export type RGBColor = [r: number, g: number, b: number];

export function rgbToCSSString(rgb: RGBColor) {
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
}

export function pointsToSvgPath(points: Point[]) {
  const coords = pointsToCoordsArray(points);
  const size = coords.length;
  const last = size - 4;

  let path = `M${coords[0]},${coords[1]}`;

  for (let i = 0; i < size - 2; i += 2) {
    const x0 = i ? coords[i - 2] : coords[0];
    const y0 = i ? coords[i - 1] : coords[1];

    const x1 = coords[i + 0];
    const y1 = coords[i + 1];

    const x2 = coords[i + 2];
    const y2 = coords[i + 3];

    const x3 = i !== last ? coords[i + 4] : x2;
    const y3 = i !== last ? coords[i + 5] : y2;

    const cp1x = (-x0 + 6 * x1 + x2) / 6;
    const cp1y = (-y0 + 6 * y1 + y2) / 6;

    const cp2x = (x1 + 6 * x2 - x3) / 6;
    const cp2y = (y1 + 6 * y2 - y3) / 6;

    path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
  return path;
}
