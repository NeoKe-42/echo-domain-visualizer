export type Quality = 'low' | 'medium' | 'high';
export type PaletteName = 'deep' | 'aurora' | 'lava';
export type AudioFeatures = { overall: number; bass: number; mid: number; treble: number; beat: number; spectrum: Float32Array };
export type VisualSettings = { sensitivity: number; intensity: number; smoothing: number; autoCamera: boolean; quality: Quality; palette: PaletteName };
export const DEFAULT_SETTINGS: VisualSettings = { sensitivity: 1.2, intensity: 1.08, smoothing: .68, autoCamera: true, quality: 'medium', palette: 'deep' };
