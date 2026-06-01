// AudioWorkletProcessor: acumula el audio entrante y corre la detección de
// pitch (MPM) fuera del hilo principal, posteando {frequency, level} al main.
//
// IMPORTANTE: un AudioWorklet no puede usar `import`, así que el algoritmo MPM
// está embebido acá. Es un espejo de src/audio/mpm.js — si se toca uno, tocar
// el otro. `sampleRate` es un global del AudioWorkletGlobalScope.
// Vive en public/ para que Vite lo emita como archivo real (no inline) y se
// sirva en /pitch-processor.js.

const MIN_HZ = 70;
const MAX_HZ = 1500;
const CLARITY_THRESHOLD = 0.9;
const MIN_CLARITY = 0.4;
const RMS_GATE = 0.015;

function detectPitch(buf, sr) {
  const size = buf.length;
  const maxLag = Math.min(size - 1, Math.floor(sr / MIN_HZ));
  const minLag = Math.max(1, Math.floor(sr / MAX_HZ));

  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = 0; tau <= maxLag; tau++) {
    let acf = 0;
    let div = 0;
    for (let j = 0; j + tau < size; j++) {
      const a = buf[j];
      const b = buf[j + tau];
      acf += a * b;
      div += a * a + b * b;
    }
    nsdf[tau] = div > 0 ? (2 * acf) / div : 0;
  }

  const peaks = [];
  let tau = minLag;
  while (tau <= maxLag && nsdf[tau] > 0) tau++;
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau] <= 0) tau++;
    let peakLag = -1;
    let peakVal = -1;
    while (tau <= maxLag && nsdf[tau] > 0) {
      if (nsdf[tau] > peakVal) {
        peakVal = nsdf[tau];
        peakLag = tau;
      }
      tau++;
    }
    if (peakLag > 0) peaks.push([peakLag, peakVal]);
  }

  if (peaks.length === 0) return -1;

  let maxVal = 0;
  for (const [, v] of peaks) if (v > maxVal) maxVal = v;
  if (maxVal < MIN_CLARITY) return -1;

  const threshold = CLARITY_THRESHOLD * maxVal;
  let chosen = peaks[0];
  for (const p of peaks) {
    if (p[1] >= threshold) {
      chosen = p;
      break;
    }
  }

  const t = chosen[0];
  let period = t;
  if (t > 0 && t < maxLag) {
    const x1 = nsdf[t - 1];
    const x2 = nsdf[t];
    const x3 = nsdf[t + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a !== 0) period = t - b / (2 * a);
  }

  const freq = sr / period;
  if (freq < MIN_HZ || freq > MAX_HZ) return -1;
  return freq;
}

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 4096;
    this.ring = new Float32Array(this.size);
    this.writeIndex = 0;
    this.hop = 2048; // analizar cada ~2048 muestras nuevas
    this.sinceLast = 0;
    this.analysisBuf = new Float32Array(this.size);
  }

  process(inputs) {
    const input = inputs[0];
    const ch = input && input[0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.ring[this.writeIndex] = ch[i];
        this.writeIndex = (this.writeIndex + 1) % this.size;
        this.sinceLast++;
      }
      if (this.sinceLast >= this.hop) {
        this.sinceLast = 0;
        this.analyze();
      }
    }
    return true; // mantener vivo el procesador
  }

  analyze() {
    const buf = this.analysisBuf;
    for (let i = 0; i < this.size; i++) {
      buf[i] = this.ring[(this.writeIndex + i) % this.size];
    }

    let sumSq = 0;
    for (let i = 0; i < this.size; i++) sumSq += buf[i] * buf[i];
    const rms = Math.sqrt(sumSq / this.size);
    const level = Math.min(1, rms * 8);

    if (rms < RMS_GATE) {
      this.port.postMessage({ frequency: null, level });
      return;
    }
    const freq = detectPitch(buf, sampleRate);
    this.port.postMessage({ frequency: freq > 0 ? freq : null, level });
  }
}

registerProcessor("pitch-processor", PitchProcessor);
