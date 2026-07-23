import type { AudioFeatures } from '../types';

export function extractFeatures(data: Uint8Array, time: Uint8Array, sampleRate: number): Omit<AudioFeatures, 'beat' | 'spectrum'> {
  const hzPerBin = sampleRate / (data.length * 2);
  const band = (from: number, to: number) => {
    const a = Math.max(0, Math.floor(from / hzPerBin));
    const b = Math.min(data.length - 1, Math.ceil(to / hzPerBin));
    let sum = 0;
    for (let i = a; i <= b; i++) sum += (data[i] / 255) ** 1.65;
    return sum / Math.max(1, b - a + 1);
  };
  let squares = 0;
  for (const value of time) squares += ((value - 128) / 128) ** 2;
  return { overall: Math.sqrt(squares / time.length), bass: band(20, 250), mid: band(250, 2000), treble: band(2000, 12000) };
}
