// Aguja del medidor de cents (-50…+50).
export function createCentsMeter(needleEl) {
  return {
    update(cents, status) {
      const clamped = Math.max(-50, Math.min(50, cents));
      // 50% centro; ±45% de recorrido -> queda dentro de 5%..95%.
      const pos = 50 + (clamped / 50) * 45;
      needleEl.style.left = pos + "%";
      needleEl.className = "needle " + status;
    },
  };
}
