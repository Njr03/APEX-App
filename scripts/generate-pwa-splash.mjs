#!/usr/bin/env node
/**
 * Generates PWA icons + full-screen launch splashes from assets/images/icon.png.
 * Run: node scripts/generate-pwa-splash.mjs
 */
import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO = join(ROOT, 'assets/images/icon.png');
const PUBLIC = join(ROOT, 'public');
const SPLASH_OUT = join(PUBLIC, 'splash');
const BG = { r: 10, g: 10, b: 15, alpha: 1 };

const ICON_SIZES = [
  { file: 'favicon.png', size: 64, logoScale: 0.82 },
  { file: 'pwa-192.png', size: 192, logoScale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, logoScale: 0.78 },
  { file: 'pwa-512.png', size: 512, logoScale: 0.78 },
];

/** Image pixel size + output filename (without .png) */
const SPLASH_SIZES = [
  { file: 'iphone-se', width: 750, height: 1334 },
  { file: 'iphone-8-plus', width: 1242, height: 2208 },
  { file: 'iphone-x', width: 1125, height: 2436 },
  { file: 'iphone-xr', width: 828, height: 1792 },
  { file: 'iphone-12', width: 1170, height: 2532 },
  { file: 'iphone-12-pro-max', width: 1284, height: 2778 },
  { file: 'iphone-15-pro', width: 1179, height: 2556 },
  { file: 'iphone-15-pro-max', width: 1290, height: 2796 },
  { file: 'ipad-10', width: 1620, height: 2160 },
  { file: 'ipad-pro-11', width: 1668, height: 2388 },
  { file: 'ipad-pro-12', width: 2048, height: 2732 },
];

async function composeLogoOnCanvas(sharp, width, height, logoScale) {
  const logoSize = Math.round(Math.min(width, height) * logoScale);
  const logo = await sharp(LOGO)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png();
}

async function main() {
  const sharp = (await import('sharp')).default;

  mkdirSync(SPLASH_OUT, { recursive: true });

  for (const { file, size, logoScale } of ICON_SIZES) {
    const image = await composeLogoOnCanvas(sharp, size, size, logoScale);
    await image.toFile(join(PUBLIC, file));
    console.log(`  ${file} (${size}x${size})`);
  }

  copyFileSync(join(PUBLIC, 'favicon.png'), join(ROOT, 'assets/images/favicon.png'));

  for (const { file, width, height } of SPLASH_SIZES) {
    const image = await composeLogoOnCanvas(sharp, width, height, 0.36);
    await image.toFile(join(SPLASH_OUT, `${file}.png`));
    console.log(`  splash/${file}.png (${width}x${height})`);
  }

  console.log('Generated PWA icons + launch splashes in public/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
