// Genera los PNG del ícono (púa) a partir de icon.svg.
// Correr con: npm run icons
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "icon.svg"));

const targets = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/maskable-512.png", 512],
  ["public/apple-touch-icon.png", 180],
  ["public/favicon-32.png", 32],
];

for (const [file, size] of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(root, file));
  console.log("✓", file, `(${size}×${size})`);
}
