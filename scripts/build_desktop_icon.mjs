// Renders the app mark into a 1024x1024 PNG used as the desktop app icon.
// Usage: node scripts/build_desktop_icon.mjs
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const SIZE = 1024;
const LOGO_SIZE = 600;
const RADIUS = 224;

const source = await readFile(path.join(root, "app", "icon.svg"));
const logo = await sharp(source, { density: 600 })
  .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const background = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
     <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#ffffff"/>
   </svg>`,
);

const outDir = path.join(root, "desktop");
await mkdir(outDir, { recursive: true });
await sharp(background)
  .composite([{ input: logo, gravity: "center" }])
  .png()
  .toFile(path.join(outDir, "icon.png"));

console.log("Wrote desktop/icon.png");
