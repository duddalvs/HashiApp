import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Composição da tela nativa usando o caminhão vetorial e a logo aprovada, sem alterar o PNG original.
const wordmark = (await readFile(new URL('../assets/Hashi_App_v1.png', import.meta.url))).toString(
  'base64',
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g transform="translate(128,110) scale(1.6)">
    <g fill="#ff6200">
      <path d="M12 16h83v53H12a7 7 0 0 1-7-7V23a7 7 0 0 1 7-7ZM95 30h31l25 26v13H95V30Z"/>
      <path d="M8 70h144" stroke="#ff6200" stroke-width="7"/>
      <circle cx="35" cy="74" r="14"/><circle cx="122" cy="74" r="14"/>
    </g>
    <g fill="white">
      <path d="M105 39h17l17 18h-34V39Z"/><rect x="16" y="26" width="67" height="30" rx="2"/>
      <circle cx="35" cy="74" r="6"/><circle cx="122" cy="74" r="6"/>
    </g>
  </g>
  <image x="26" y="253" width="460" height="154.325" href="data:image/png;base64,${wordmark}"/>
</svg>`;
await sharp(Buffer.from(svg))
  .png()
  .toFile(fileURLToPath(new URL('../assets/splash-hashi-app.png', import.meta.url)));
console.log('Splash Hashi App gerado.');
