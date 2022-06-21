// eslint-disable-next-line import/prefer-default-export
export function pointsToSvgPath(data: number[]) {
  const size = data.length;
  const last = size - 4;

  let path = `M${data[0]},${data[1]}`;

  for (let i = 0; i < size - 2; i += 2) {
    const x0 = i ? data[i - 2] : data[0];
    const y0 = i ? data[i - 1] : data[1];

    const x1 = data[i + 0];
    const y1 = data[i + 1];

    const x2 = data[i + 2];
    const y2 = data[i + 3];

    const x3 = i !== last ? data[i + 4] : x2;
    const y3 = i !== last ? data[i + 5] : y2;

    const cp1x = (-x0 + 6 * x1 + x2) / 6;
    const cp1y = (-y0 + 6 * y1 + y2) / 6;

    const cp2x = (x1 + 6 * x2 - x3) / 6;
    const cp2y = (y1 + 6 * y2 - y3) / 6;

    path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
  return path;
}
