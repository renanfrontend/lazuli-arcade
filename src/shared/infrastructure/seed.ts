import type { SeedSource } from '../application/ports';

export const cryptoSeed: SeedSource = () => {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now() >>> 0;
  } catch {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }
};
