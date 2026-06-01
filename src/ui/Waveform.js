// Barras de actividad. A diferencia del original (cosmético/random),
// acá la altura se deriva del nivel de audio real (RMS).
export function createWaveform(container, count = 38) {
  const bars = [];
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    container.appendChild(bar);
    bars.push(bar);
  }

  const mid = (count - 1) / 2;

  return {
    update(level, active) {
      for (let i = 0; i < count; i++) {
        if (!active) {
          bars[i].style.height = "4px";
          continue;
        }
        // Forma de campana: más alto en el centro.
        const center = 1 - Math.abs(i - mid) / mid;
        const amp = level * 22 * (0.4 + 0.6 * center);
        const jitter = Math.random() * 4;
        bars[i].style.height = (4 + amp + jitter).toFixed(1) + "px";
      }
    },
  };
}
