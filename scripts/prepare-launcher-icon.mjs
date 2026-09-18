import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Package the supplied artwork into square Android launcher resources without cropping it.
// Keep iconn.png unchanged; adaptive icons need extra space for the launcher's mask.
const source = new URL('../assets/iconn.png', import.meta.url);
for (const { name, artworkSize, background } of [
  { name: 'iconn-launcher.png', artworkSize: 760, background: '#ffffff' },
  { name: 'iconn-adaptive.png', artworkSize: 600, background: '#ffffff00' },
]) {
  const artwork = await sharp(fileURLToPath(source))
    .resize({ width: artworkSize, height: artworkSize, fit: 'inside' })
    .png()
    .toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background } })
    .composite([{ input: artwork, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`../assets/${name}`, import.meta.url)));
}
console.log('Launcher resources prepared from assets/iconn.png.');
