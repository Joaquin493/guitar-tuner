// Gráfico de estabilidad: dibuja los últimos segundos de desviación en cents
// para ver si la cuerda se mantiene afinada o "se va" tras afinar.
// El sample más nuevo entra por la derecha y el historial se desplaza.

const COLORS = {
  inTune: "#34d399",
  close: "#fbbf24",
  flat: "#60a5fa",
  sharp: "#fb923c",
  silent: "#5b6472",
};

export function createStabilityGraph(canvas, maxSamples = 150) {
  const ctx = canvas.getContext("2d");
  const samples = []; // cada item: { cents, status } o null (silencio)
  let w = 0;
  let h = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function draw() {
    if (w === 0) resize();
    ctx.clearRect(0, 0, w, h);

    const mid = h / 2;
    const halfH = h / 2 - 2;
    const yOf = (c) => mid - (Math.max(-50, Math.min(50, c)) / 50) * halfH;

    // Banda de afinado (±5 cents).
    const band = (5 / 50) * halfH;
    ctx.fillStyle = "rgba(52, 211, 153, 0.10)";
    ctx.fillRect(0, mid - band, w, band * 2);

    // Línea central (0 cents).
    ctx.strokeStyle = "rgba(190, 168, 105, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    const n = samples.length;
    if (n < 2) return;

    const step = w / (maxSamples - 1);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let i = 1; i < n; i++) {
      const a = samples[i - 1];
      const b = samples[i];
      if (!a || !b) continue; // corta la línea en los huecos de silencio
      const x1 = w - (n - 1 - (i - 1)) * step;
      const x2 = w - (n - 1 - i) * step;
      ctx.strokeStyle = COLORS[b.status] || COLORS.silent;
      ctx.beginPath();
      ctx.moveTo(x1, yOf(a.cents));
      ctx.lineTo(x2, yOf(b.cents));
      ctx.stroke();
    }
  }

  return {
    push(sample) {
      samples.push(sample);
      if (samples.length > maxSamples) samples.shift();
      draw();
    },
    clear() {
      samples.length = 0;
      draw();
    },
  };
}
