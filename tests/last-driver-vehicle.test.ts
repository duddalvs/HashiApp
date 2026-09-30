import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

test('SQL: ultimo veiculo respeita historico salvo, datas, edicao e permissoes', async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create schema extensions; create extension pgcrypto with schema extensions;
      create table auth.users(id uuid primary key,email text,encrypted_password text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    for (const file of readdirSync('supabase/migrations')
      .filter((f) => f.endsWith('.sql'))
      .sort()) {
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    }
    await db.exec(readFileSync('supabase/tests/last-driver-vehicle-validation.sql', 'utf8'));
    assert.equal((await db.query('select * from public.manutencoes')).rows.length, 0);
    assert.equal((await db.query('select * from public.usuarios')).rows.length, 0);
  } finally {
    await db.close();
  }
});
