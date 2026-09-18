import { existsSync, readFileSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key.startsWith('sb_publishable_')) {
  console.error('Configure a URL e a chave publishable do Supabase no .env antes de gerar o APK.');
  process.exit(1);
}
const config = JSON.parse(readFileSync('app.json', 'utf8'));
if (!config.expo.extra?.eas?.projectId) {
  console.error(
    'Vincule o projeto à conta Expo com npx eas-cli@latest login e npx eas-cli@latest init antes de gerar o APK.',
  );
  process.exit(1);
}
console.log(
  'Configuração local pronta. Confirme que o ambiente preview do EAS contém as mesmas variáveis públicas.',
);
