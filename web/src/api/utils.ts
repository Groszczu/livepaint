export const lsb = (n: number) => {
  return n & 0x00ff;
};

export const msb = (n: number) => {
  return n & 0xff00;
};

export const toUint16 = (bytes: Uint8Array) => {
  return (bytes[0] << 8) | bytes[1];
};
