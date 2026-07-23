export class BeatDetector {
  private history: number[] = [];
  private lastBeat = 0;
  detect(bass: number, now: number) {
    this.history.push(bass);
    if (this.history.length > 48) this.history.shift();
    const avg = this.history.reduce((a, b) => a + b, 0) / Math.max(1, this.history.length);
    const variance = this.history.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, this.history.length);
    const threshold = avg * (1.38 + Math.min(.3, variance * 5)) + .018;
    if (this.history.length > 12 && bass > threshold && bass > .075 && now - this.lastBeat > 230) {
      this.lastBeat = now;
      return 1;
    }
    return 0;
  }
}
