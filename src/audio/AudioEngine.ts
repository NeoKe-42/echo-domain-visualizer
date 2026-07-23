import { BeatDetector } from './beatDetector';
import { extractFeatures } from './frequencyBands';
import type { AudioFeatures } from '../types';

export class AudioEngine {
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private elementSource?: MediaElementAudioSourceNode;
  private streamSource?: MediaStreamAudioSourceNode;
  private audio?: HTMLAudioElement;
  private stream?: MediaStream;
  private objectUrl?: string;
  private freq = new Uint8Array(1024);
  private time = new Uint8Array(2048);
  private beat = new BeatDetector();
  private smooth: AudioFeatures = { overall: 0, bass: 0, mid: 0, treble: 0, beat: 0, spectrum: new Float32Array(64) };
  private micEnvelope = .035;
  private micNoiseFloor = .008;
  mode: 'idle' | 'file' | 'mic' | 'capture' = 'idle';

  private setup() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (!this.analyser) { this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 2048; this.analyser.smoothingTimeConstant = .62; }
    return this.ctx;
  }
  async loadFile(file: File) {
    this.stopStream();
    const ctx = this.setup();
    if (!this.audio) {
      this.audio = new Audio(); this.audio.preload = 'metadata';
      this.elementSource = ctx.createMediaElementSource(this.audio);
      this.elementSource.connect(this.analyser!); this.analyser!.connect(ctx.destination);
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(file); this.audio.src = this.objectUrl; this.mode = 'file';
    await ctx.resume(); await this.audio.play();
    return this.audio;
  }
  async startMic() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器不支持麦克风输入');
    this.pause(); this.stopStream();
    const ctx = this.setup(); await ctx.resume();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true }, video: false });
    this.streamSource = ctx.createMediaStreamSource(this.stream); this.streamSource.connect(this.analyser!); this.mode = 'mic';
    this.micEnvelope = .035; this.micNoiseFloor = .008;
  }
  async startCapture(onEnded?: () => void) {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('当前浏览器不支持系统音频捕获');
    this.pause(); this.stopStream();
    const ctx = this.setup(); await ctx.resume();
    this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (!this.stream.getAudioTracks().length) {
      this.stream.getTracks().forEach(track => track.stop()); this.stream = undefined;
      throw new Error('没有收到音轨。请重新选择并勾选“共享系统音频”');
    }
    this.streamSource = ctx.createMediaStreamSource(this.stream); this.streamSource.connect(this.analyser!);
    this.mode = 'capture';
    this.stream.getTracks().forEach(track => { track.onended = () => { this.stopStream(); onEnded?.(); }; });
  }
  stopStream() { this.stream?.getTracks().forEach(t => { t.onended = null; t.stop(); }); this.streamSource?.disconnect(); this.streamSource = undefined; this.stream = undefined; if (this.mode === 'mic' || this.mode === 'capture') this.mode = 'idle'; }
  getAudio() { return this.audio; }
  async toggle() { if (!this.audio) return; await this.ctx?.resume(); if (this.audio.paused) await this.audio.play(); else this.audio.pause(); }
  pause() { this.audio?.pause(); }
  setVolume(value: number) { if (this.audio) this.audio.volume = value; }
  sample(smoothing: number, sensitivity: number): AudioFeatures {
    if (!this.analyser || !this.ctx || this.ctx.state !== 'running') return this.decay();
    this.analyser.getByteFrequencyData(this.freq); this.analyser.getByteTimeDomainData(this.time);
    const raw = extractFeatures(this.freq, this.time, this.ctx.sampleRate);
    for (let i = 0; i < 64; i++) {
      const start = Math.floor((Math.pow(i / 64, 2.15) * .92 + .002) * this.freq.length);
      const end = Math.max(start + 1, Math.floor((Math.pow((i + 1) / 64, 2.15) * .92 + .002) * this.freq.length));
      let sum = 0;
      for (let j = start; j < Math.min(end, this.freq.length); j++) sum += this.freq[j] / 255;
      const value = sum / Math.max(1, end - start);
      const gain = this.mode === 'mic' ? 3.8 : 1.7;
      const targetBin = Math.min(1, value * gain);
      const current = this.smooth.spectrum[i];
      this.smooth.spectrum[i] += (targetBin - current) * (targetBin > current ? .32 : .075);
    }
    let normalized = raw;
    if (this.mode === 'mic') {
      // Headset microphones are speech-focused and commonly remove most sub-bass.
      // Track their useful range adaptively and borrow low-mid energy for wave impact.
      this.micEnvelope = Math.max(raw.overall, this.micEnvelope * .992);
      if (raw.overall < this.micEnvelope * .45) this.micNoiseFloor += (raw.overall - this.micNoiseFloor) * .006;
      const usable = Math.max(0, raw.overall - this.micNoiseFloor * .82);
      const adaptiveGain = Math.min(14, Math.max(4.5, .52 / Math.max(.035, this.micEnvelope)));
      const gate = Math.min(1, usable * adaptiveGain * 3.2);
      normalized = {
        overall: 1 - Math.exp(-usable * adaptiveGain * 2.1),
        bass: (1 - Math.exp(-Math.max(raw.bass, raw.mid * .62) * adaptiveGain * 1.7)) * gate,
        mid: (1 - Math.exp(-raw.mid * adaptiveGain * 1.9)) * gate,
        treble: (1 - Math.exp(-raw.treble * adaptiveGain * 2.2)) * gate,
      };
    }
    const target = { ...normalized, beat: this.beat.detect(normalized.bass, performance.now()) };
    const release = .86 + smoothing * .105;
    (['overall','bass','mid','treble'] as const).forEach(k => {
      const v = Math.min(1, target[k] * sensitivity * 2.1);
      this.smooth[k] += (v - this.smooth[k]) * (v > this.smooth[k] ? .28 : 1 - release);
    });
    this.smooth.beat = Math.max(target.beat, this.smooth.beat * .9);
    return { ...this.smooth, spectrum: this.smooth.spectrum };
  }
  private decay() { for (const k of ['overall','bass','mid','treble'] as const) this.smooth[k] *= .97; for(let i=0;i<64;i++)this.smooth.spectrum[i]*=.96; this.smooth.beat *= .9; return { ...this.smooth, spectrum:this.smooth.spectrum }; }
  dispose() { this.pause(); this.stopStream(); if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.elementSource?.disconnect(); this.analyser?.disconnect(); void this.ctx?.close(); }
}
