// Medidor circular (arco semicircular) tipo afinador profesional.
// Construye un SVG con arco degradado, marcas y aguja animada.
// La aguja gira: 0 cents = arriba, -50 = izquierda, +50 = derecha.

const NS = "http://www.w3.org/2000/svg";

export function createCentsMeter(container) {
  container.innerHTML = "";

  // Marcas cada 10 cents (mayores en -50 / 0 / +50).
  const ticks = [];
  for (let t = -50; t <= 50; t += 10) {
    const major = t % 50 === 0 || t === 0;
    const a = ((90 - (t / 50) * 90) * Math.PI) / 180;
    const rOuter = 84;
    const rInner = major ? 68 : 76;
    const x1 = (100 + rOuter * Math.cos(a)).toFixed(1);
    const y1 = (100 - rOuter * Math.sin(a)).toFixed(1);
    const x2 = (100 + rInner * Math.cos(a)).toFixed(1);
    const y2 = (100 - rInner * Math.sin(a)).toFixed(1);
    ticks.push(
      `<line class="tick ${major ? "major" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
    );
  }

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 116");
  svg.setAttribute("class", "gauge-svg");
  svg.innerHTML = `
    <defs>
      <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="50%" stop-color="#36d399"/>
        <stop offset="100%" stop-color="#f59e0b"/>
      </linearGradient>
    </defs>
    <path class="gauge-track" d="M16 100 A84 84 0 0 1 184 100"/>
    <path class="gauge-arc" d="M16 100 A84 84 0 0 1 184 100"/>
    <g class="gauge-ticks">${ticks.join("")}</g>
    <g class="gauge-needle" transform="rotate(0 100 100)">
      <line x1="100" y1="100" x2="100" y2="26"/>
      <circle cx="100" cy="100" r="7"/>
    </g>
  `;
  container.appendChild(svg);

  const needle = svg.querySelector(".gauge-needle");

  return {
    update(cents, status) {
      const clamped = Math.max(-50, Math.min(50, cents));
      const deg = (clamped / 50) * 90;
      needle.setAttribute("transform", `rotate(${deg.toFixed(2)} 100 100)`);
      needle.setAttribute("class", `gauge-needle ${status}`);
    },
  };
}
