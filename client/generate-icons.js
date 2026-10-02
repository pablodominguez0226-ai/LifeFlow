import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

// Concepto 2: The Pulse & Monolith
// Un monolito geométrico negro obsidiana con bordes sutiles y pulso de energía pura chalk white
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="monolith-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1C1C20" />
      <stop offset="50%" stop-color="#121215" />
      <stop offset="100%" stop-color="#09090B" />
    </linearGradient>
    <linearGradient id="monolith-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3F3F46" />
      <stop offset="100%" stop-color="#27272A" />
    </linearGradient>
    <linearGradient id="pulse-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#A1A1AA" />
      <stop offset="25%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#D4D4D8" />
    </linearGradient>
    <filter id="pulse-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- The Monolith (Base Block) -->
  <rect width="512" height="512" rx="128" fill="#09090B" />
  <rect x="20" y="20" width="472" height="472" rx="112" fill="url(#monolith-bg)" stroke="url(#monolith-border)" stroke-width="8" />

  <!-- Inner Ambient Core -->
  <circle cx="256" cy="256" r="160" fill="#FFFFFF" fill-opacity="0.02" />

  <!-- The Pulse (Vital Flow Wave) -->
  <path
    d="M 84 256 L 176 256 L 208 200 L 236 332 L 284 136 L 320 312 L 348 240 L 372 256 L 428 256"
    stroke="url(#pulse-gradient)"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#pulse-glow)"
  />

  <!-- Vital Energy Spark / Pulse Node at the Peak -->
  <circle cx="284" cy="136" r="13" fill="#FFFFFF" />
  <circle cx="284" cy="136" r="22" fill="#FFFFFF" fill-opacity="0.2" />
</svg>`;

async function generate() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Guardar master SVG como favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon, 'utf-8');
  console.log('✓ Actualizado favicon.svg con Concepto 2: The Pulse & Monolith');

  const svgBuffer = Buffer.from(svgIcon);

  // 2. apple-touch-icon.png (180x180) para iPhone
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Creado apple-touch-icon.png (180x180)');

  // 3. icon-192.png (192x192)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Creado icon-192.png (192x192)');

  // 4. icon-512.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Creado icon-512.png (512x512)');

  // 5. favicon.png (64x64)
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Creado favicon.png (64x64)');
}

generate().catch((err) => {
  console.error('Error generando íconos:', err);
  process.exit(1);
});
