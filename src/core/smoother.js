// Filtro de mediana sobre las últimas N frecuencias.
// Estabiliza la aguja y descarta saltos puntuales (ruido, armónicos).
export class Smoother {
  constructor(size = 5) {
    this.size = size;
    this.values = [];
  }

  push(freq) {
    this.values.push(freq);
    if (this.values.length > this.size) this.values.shift();
    const sorted = [...this.values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  reset() {
    this.values = [];
  }
}
