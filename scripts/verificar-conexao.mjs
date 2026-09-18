import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
assert.match(url ?? '', /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
assert.ok(key?.startsWith('sb_publishable_'), 'Configure a chave publica.');
const headers = { apikey: key, 'Content-Type': 'application/json' };

const tables = [
  'usuarios',
  'funcionarios',
  'veiculos',
  'contratos',
  'tipos_manutencao',
  'registros_frota',
  'registro_equipes',
  'manutencoes',
];
for (const table of tables) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
  assert.equal(response.status, 401, `Acesso anonimo deve ser recusado: ${table}`);
  const result = await response.json();
  assert.equal(result.code, '42501', `Tabela deve existir e recusar acesso: ${table}`);
}
const history = await fetch(`${url}/rest/v1/rpc/buscar_historico`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ p_token: null, p_busca: '', p_limite: 1, p_offset: 0, p_tipo: 'todos' }),
});
assert.equal(history.status, 403, 'Historico deve recusar sessao ausente.');
assert.equal((await history.json()).code, '28000', 'Sessao deve ser validada pelo banco.');
console.log('OK: conexao publica e acesso sem sessao bloqueado nas 8 tabelas e no historico.');
