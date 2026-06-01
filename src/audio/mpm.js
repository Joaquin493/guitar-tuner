// McLeod Pitch Method (MPM).
// Detecta el período fundamental con la NSDF (Normalized Square Difference
// Function) y elige el PRIMER pico fuerte. Eso lo hace robusto frente a los
// errores de octava típicos de la autocorrelación simple (que a veces engancha
// un armónico). No requiere FFT.

const MIN_HZ = 70;
const MAX_HZ = 1500;
const CLARITY_THRESHOLD = 0.9; // fracción del pico máximo para elegir el primero
const MIN_CLARITY = 0.4; // periodicidad mínima para considerar que hay tono

export function detectPitch(buf, sampleRate) {
  const size = buf.length;
  const maxLag = Math.min(size - 1, Math.floor(sampleRate / MIN_HZ));
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_HZ));

  // NSDF normalizada a [-1, 1].
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

  // "Key maxima": el máximo de cada región positiva, tras saltar el lóbulo
  // inicial (que arranca en 1 en tau=0).
  const peaks = [];
  let tau = minLag;
  while (tau <= maxLag && nsdf[tau] > 0) tau++; // salta el lóbulo inicial
  while (tau <= maxLag) {
    while (tau <= maxLag && nsdf[tau] <= 0) tau++; // salta la zona negativa
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

  // Umbral relativo al pico más alto.
  let maxVal = 0;
  for (const [, v] of peaks) if (v > maxVal) maxVal = v;
  if (maxVal < MIN_CLARITY) return -1; // señal poco periódica (ruido)

  const threshold = CLARITY_THRESHOLD * maxVal;

  // El primer pico que supera el umbral corresponde al fundamental.
  let chosen = peaks[0];
  for (const p of peaks) {
    if (p[1] >= threshold) {
      chosen = p;
      break;
    }
  }

  // Interpolación parabólica para precisión sub-sample.
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

  const freq = sampleRate / period;
  if (freq < MIN_HZ || freq > MAX_HZ) return -1;
  return freq;
}
