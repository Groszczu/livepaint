/* eslint-disable no-bitwise */

import type { RGBColor } from './drawing';

export function djb2(str: string) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
  }
  return hash;
}

export function hashStringToRGB(str: string): RGBColor {
  const hash = djb2(str);
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;
  return [r, g, b];
}
