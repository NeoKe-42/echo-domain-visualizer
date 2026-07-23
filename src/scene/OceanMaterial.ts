import * as THREE from 'three';
import vertexShader from './shaders/ocean.vert.glsl?raw';
import fragmentShader from './shaders/ocean.frag.glsl?raw';
import type { AudioFeatures, PaletteName } from '../types';

const palettes = {
  deep: ['#020815', '#07375a', '#49e5ff'],
  aurora: ['#031413', '#0b6171', '#c26cff'],
  lava: ['#120304', '#65150e', '#ffb13b'],
} as const;

export class OceanMaterial extends THREE.ShaderMaterial {
  private paletteTarget = palettes.deep.map(c => new THREE.Color(c));
  constructor() {
    super({
      vertexShader, fragmentShader,
      uniforms: {
        uTime: { value: 0 }, uBass: { value: 0 }, uMid: { value: 0 },
        uTreble: { value: 0 }, uBeat: { value: 0 }, uEnergy: { value: 0 },
        uIntensity: { value: 1 }, uDeep: { value: new THREE.Color(palettes.deep[0]) },
        uMidColor: { value: new THREE.Color(palettes.deep[1]) }, uPeak: { value: new THREE.Color(palettes.deep[2]) },
      }
    });
  }
  setPalette(name: PaletteName) { this.paletteTarget = palettes[name].map(c => new THREE.Color(c)); }
  update(time: number, audio: AudioFeatures, intensity: number) {
    const u = this.uniforms;
    u.uTime.value = time; u.uBass.value = audio.bass; u.uMid.value = audio.mid;
    u.uTreble.value = audio.treble; u.uBeat.value = audio.beat; u.uEnergy.value = audio.overall;
    u.uIntensity.value = intensity;
    (u.uDeep.value as THREE.Color).lerp(this.paletteTarget[0], .025);
    (u.uMidColor.value as THREE.Color).lerp(this.paletteTarget[1], .025);
    (u.uPeak.value as THREE.Color).lerp(this.paletteTarget[2], .025);
  }
}
