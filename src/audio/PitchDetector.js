// Captura de micrófono (getUserMedia + Web Audio) y lectura de frecuencia.
// Preferentemente corre la detección en un AudioWorklet (fuera del hilo
// principal); si no está disponible, cae a un AnalyserNode analizado en el main.
import { detectPitch } from "./mpm.js";

const RMS_GATE = 0.015; // umbral de silencio
// Se sirve desde public/ como archivo real (ver public/pitch-processor.js).
const PITCH_PROCESSOR_URL = `${import.meta.env.BASE_URL}pitch-processor.js`;

export class PitchDetector {
  constructor() {
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.node = null; // AudioWorkletNode
    this.sink = null;
    this.analyser = null; // fallback
    this.buffer = null;
    this.sampleRate = 44100;
    this.useWorklet = false;
    this.latest = { frequency: null, level: 0 };
    this.running = false;
  }

  async start() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new Ctx();
    // Los navegadores arrancan el contexto suspendido: reanudar tras el gesto
    // del usuario (click del botón de micrófono).
    await this.audioContext.resume();
    this.sampleRate = this.audioContext.sampleRate;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Intentar el AudioWorklet (procesa fuera del hilo principal).
    try {
      if (this.audioContext.audioWorklet) {
        await this.audioContext.audioWorklet.addModule(PITCH_PROCESSOR_URL);
        this.node = new AudioWorkletNode(this.audioContext, "pitch-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        });
        this.node.port.onmessage = (e) => {
          this.latest = e.data;
        };
        // Conectar a un gain en silencio hacia destination para que el grafo
        // "tire" del nodo y se ejecute process() (no suena: salida vacía + 0).
        this.sink = this.audioContext.createGain();
        this.sink.gain.value = 0;
        this.source.connect(this.node);
        this.node.connect(this.sink).connect(this.audioContext.destination);
        this.useWorklet = true;
      }
    } catch (err) {
      console.warn("AudioWorklet no disponible, uso AnalyserNode:", err);
      this.useWorklet = false;
    }

    // Fallback: AnalyserNode + análisis en el hilo principal.
    if (!this.useWorklet) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      this.source.connect(this.analyser);
      this.buffer = new Float32Array(this.analyser.fftSize);
    }

    this.running = true;
  }

  stop() {
    this.running = false;
    if (this.node) {
      this.node.port.onmessage = null;
      this.node.disconnect();
    }
    if (this.sink) this.sink.disconnect();
    if (this.analyser) this.analyser.disconnect();
    if (this.source) this.source.disconnect();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.node = null;
    this.sink = null;
    this.analyser = null;
    this.buffer = null;
    this.useWorklet = false;
    this.latest = { frequency: null, level: 0 };
  }

  /** @returns {{ frequency: number|null, level: number }} */
  read() {
    if (!this.running) return { frequency: null, level: 0 };

    // Con worklet: devolver el último resultado posteado desde el otro hilo.
    if (this.useWorklet) return this.latest;

    // Fallback: analizar el buffer en el hilo principal.
    if (!this.analyser) return { frequency: null, level: 0 };
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sumSq = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      sumSq += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSq / this.buffer.length);
    const level = Math.min(1, rms * 8);
    if (rms < RMS_GATE) return { frequency: null, level };
    const freq = detectPitch(this.buffer, this.sampleRate);
    return { frequency: freq > 0 ? freq : null, level };
  }
}
