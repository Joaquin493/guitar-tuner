// Captura de micrófono (getUserMedia + Web Audio) y lectura de frecuencia.
import { detectPitch } from "./mpm.js";

const RMS_GATE = 0.015; // umbral de silencio (igual al original)

export class PitchDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.buffer = null;
    this.sampleRate = 44100;
    this.running = false;
  }

  async start() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new Ctx();
    // Los navegadores arrancan el contexto suspendido: hay que reanudarlo
    // tras un gesto del usuario (el click del botón de micrófono).
    await this.audioContext.resume();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 4096;
    this.source.connect(this.analyser);

    this.buffer = new Float32Array(this.analyser.fftSize);
    this.sampleRate = this.audioContext.sampleRate;
    this.running = true;
  }

  stop() {
    this.running = false;
    if (this.source) this.source.disconnect();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
  }

  /** @returns {{ frequency: number|null, level: number }} */
  read() {
    if (!this.running || !this.analyser) return { frequency: null, level: 0 };

    this.analyser.getFloatTimeDomainData(this.buffer);

    let sumSq = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSq += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSq / this.buffer.length);
    const level = Math.min(1, rms * 8); // 0..1 para la waveform

    if (rms < RMS_GATE) return { frequency: null, level };

    const freq = detectPitch(this.buffer, this.sampleRate);
    return { frequency: freq > 0 ? freq : null, level };
  }
}
