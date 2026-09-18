import { readFile, writeFile } from 'node:fs/promises';
const files = [
  'supabase/migrations/202609100001_schema.sql',
  'supabase/migrations/202609100002_cadastros.sql',
];
const sql = await Promise.all(files.map((path) => readFile(path, 'utf8')));
await writeFile(
  'supabase/instalar.sql',
  '-- INSTALAÇÃO INICIAL EM PROJETO SUPABASE NOVO. Executar uma vez.\n\n' + sql.join('\n\n'),
);
console.log('supabase/instalar.sql pronto para o SQL Editor.');
