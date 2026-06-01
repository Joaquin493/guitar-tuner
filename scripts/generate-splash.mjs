// Genera los splash screens de iOS (apple-touch-startup-image) y los tags HTML.
// iOS exige una imagen por resolución con un media-query exacto; Android usa el
// manifest y no necesita esto.
// Correr con: npm run splash   (luego pegar scripts/_splash-tags.html en <head>)
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "splash");
mkdirSync(outDir, { recursive: true });

const PICK =
  "M256 110 C 322 110, 374 152, 374 216 C 374 302, 300 384, 256 412 " +
  "C 212 384, 138 302, 138 216 C 138 152, 190 110, 256 110 Z";
const HIGHLIGHT =
  "M256 132 C 302 132, 340 162, 346 208 C 300 194, 232 194, 186 216 " +
  "C 192 166, 216 132, 256 132 Z";

// Dispositivos en portrait: { w, h (CSS px), dpr }.
const devices = [
  { w: 375, h: 667, dpr: 2 }, // SE 2/3, 6/7/8
  { w: 414, h: 736, dpr: 3 }, // 8 Plus
  { w: 375, h: 812, dpr: 3 }, // X / XS / 11 Pro
  { w: 414, h: 896, dpr: 2 }, // XR / 11
  { w: 414, h: 896, dpr: 3 }, // XS Max / 11 Pro Max
  { w: 360, h: 780, dpr: 3 }, // 12/13 mini
  { w: 390, h: 844, dpr: 3 }, // 12 / 13 / 14
  { w: 393, h: 852, dpr: 3 }, // 14 Pro / 15 / 16
  { w: 428, h: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Pro Max, 16 Plus
  { w: 402, h: 874, dpr: 3 }, // 16 Pro
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max
  { w: 768, h: 1024, dpr: 2 }, // iPad 9.7 / mini
  { w: 810, h: 1080, dpr: 2 }, // iPad 10.2
  { w: 820, h: 1180, dpr: 2 }, // iPad Air 10.9
  { w: 834, h: 1112, dpr: 2 }, // iPad Pro 10.5
  { w: 834, h: 1194, dpr: 2 }, // iPad Pro 11
  { w: 1024, h: 1366, dpr: 2 }, // iPad Pro 12.9
];

function splashSvg(W, H) {
  const s = Math.round(Math.min(W, H) * 0.3);
  const x = Math.round((W - s) / 2);
  const y = Math.round((H - s) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="80%">
      <stop offset="0%" stop-color="#15151d"/>
      <stop offset="100%" stop-color="#08080c"/>
    </radialGradient>
    <linearGradient id="pick" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0dca6"/>
      <stop offset="45%" stop-color="#cdab5f"/>
      <stop offset="100%" stop-color="#9c7b32"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 512 512">
    <path d="${PICK}" fill="url(#pick)"/>
    <path d="${HIGHLIGHT}" fill="#ffffff" fill-opacity="0.20"/>
  </svg>
</svg>`;
}

const tags = [];
const seen = new Set();

for (const { w, h, dpr } of devices) {
  const W = w * dpr;
  const H = h * dpr;
  const file = `splash-${W}x${H}.png`;
  if (!seen.has(file)) {
    seen.add(file);
    await sharp(Buffer.from(splashSvg(W, H))).png().toFile(join(outDir, file));
    console.log("✓", file);
  }
  tags.push(
    `    <link rel="apple-touch-startup-image" media="screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="/splash/${file}" />`
  );
}

writeFileSync(join(root, "scripts", "_splash-tags.html"), tags.join("\n") + "\n");
console.log(`\n${tags.length} tags escritos en scripts/_splash-tags.html`);
