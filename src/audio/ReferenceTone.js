// Reproduce el tono objetivo de una cuerda con un OscillatorNode.
// Usa su propio AudioContext (independiente del micrófono), creado al primer
// uso para respetar el gesto del usuario requerido por los navegadores.
export class ReferenceTone {
  constructor() {
    this.ctx = null;
    this.osc = null;
  }

  play(freq, duration = 1.4) {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();

    this.stop();

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle"; // un poco más cálido que la sinusoide pura
    osc.frequency.value = freq;

    // Envolvente con ataque y caída suaves para evitar clics.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.setValueAtTime(0.25, now + duration - 0.15);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    osc.onended = () => {
      gain.disconnect();
      if (this.osc === osc) this.osc = null;
    };
    this.osc = osc;
  }

  stop() {
    if (this.osc) {
      try {
        this.osc.stop();
      } catch {
        /* ya detenido */
      }
      this.osc.disconnect();
      this.osc = null;
    }
  }
}
