// Detección de frecuencia por autocorrelación (variante ACF2+).
// Equivalente al vDSP_conv del original, en JS puro.
// El gate de silencio (RMS < 0.015) se aplica antes, en PitchDetector.

export function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;

  // Recorta los extremos de baja amplitud para estabilizar la ACF.
  const thres = 0.2;
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  const trimmed = buf.slice(r1, r2);
  const n = trimmed.length;
  if (n < 2) return -1;

  // Función de autocorrelación.
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  // Salta el primer descenso, luego busca el pico máximo.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  if (maxpos <= 0 || maxpos >= n - 1) return -1;

  // Interpolación parabólica para precisión sub-sample (~±2 cents).
  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}
