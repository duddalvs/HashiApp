import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const truck =
  '<g fill="#ff6200"><path d="M12 16h83v53H12a7 7 0 0 1-7-7V23a7 7 0 0 1 7-7ZM95 30h31l25 26v17H95Z"/><path d="M8 67h144v7H8Z"/><circle cx="35" cy="74" r="14"/><circle cx="122" cy="74" r="14"/></g><g fill="white"><rect x="16" y="26" width="67" height="30" rx="2"/><path d="M105 39h17l17 18h-34Z"/><circle cx="35" cy="74" r="6"/><circle cx="122" cy="74" r="6"/></g>';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="white"/><g transform="translate(208,230) scale(3.8)">${truck}</g><text x="512" y="685" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="88" fill="#0b2c44">HASHIMOTO</text><text x="512" y="775" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="63" letter-spacing="15" fill="#ff6200">FROTA</text></svg>`;
await writeFile('assets/brand.svg', svg);
await sharp(Buffer.from(svg)).png().toFile('assets/icon.png');
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('assets/splash.png');
const adaptive = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><g transform="translate(272,355) scale(3)">${truck}</g></svg>`;
await sharp(Buffer.from(adaptive)).png().toFile('assets/adaptive-icon.png');
console.log('Identidade vetorial e ícones Android gerados.');
