// Runs on the audio thread: downsamples the mic to 16 kHz by averaging, posts ~100 ms Int16 chunks and the level.
class PcmCapture extends AudioWorkletProcessor {
  constructor({ processorOptions: { inRate, outRate } }) {
    super(); this.ratio = inRate / outRate; this.acc = []; this.pos = 0; this.out = []; this.frames = 0; this.peak = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]; if (!ch) return true;
    for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > this.peak) this.peak = a; }
    this.acc.push(...ch);
    // average `ratio` input samples per output sample (ratio is 1.5 at the page's 24 kHz context, 3 at 48 kHz)
    while (this.pos + this.ratio <= this.acc.length) {
      let sum = 0, n = 0; for (let j = Math.floor(this.pos); j < this.pos + this.ratio && j < this.acc.length; j++) { sum += this.acc[j]; n++; }
      const v = Math.max(-1, Math.min(1, sum / n)); this.out.push(v < 0 ? v * 32768 : v * 32767); this.pos += this.ratio;
    }
    if (this.acc.length > 8192) { const cut = Math.floor(this.pos); this.acc = this.acc.slice(cut); this.pos -= cut; }
    this.frames += ch.length;
    if (this.out.length >= 1600) {                                              // 100 ms at 16 kHz
      const pcm = new Int16Array(this.out.splice(0, 1600));
      this.port.postMessage({ pcm: pcm.buffer, amp: Math.min(100, Math.round(this.peak * 140)) }, [pcm.buffer]); this.peak = 0;
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
