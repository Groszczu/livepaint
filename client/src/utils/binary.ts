/* eslint-disable no-bitwise */

export function bytesToShort(bytes: number[]) {
  return (bytes[0] << 8) | bytes[1];
}

export function shortToBytes(n: number): [number, number] {
  const lowerBites = 2 ** 8 - 1;
  const upperBites = 2 ** 16 - 1 - lowerBites;
  return [(n & upperBites) >> 8, n & lowerBites];
}
