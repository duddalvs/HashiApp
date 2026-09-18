import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('PostgreSQL: migrações, cadastros, Auth, RLS, atomicidade, idempotência e histórico', async (t) => {
  const db = new PGlite();
  const userA = '10000000-0000-4000-8000-000000000001';
  const userB = '10000000-0000-4000-8000-000000000002';
  const userAdmin = '10000000-0000-4000-8000-000000000003';
  const userInactive = '10000000-0000-4000-8000-000000000004';
  const regId = '20000000-0000-4000-8000-000000000001';
  const maintId = '30000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(readFileSync('supabase/migrations/202609100001_schema.sql', 'utf8'));
    await db.exec(readFileSync('supabase/migrations/202609100002_cadastros.sql', 'utf8'));
    await db.exec(readFileSync('supabase/migrations/202609100002_cadastros.sql', 'utf8'));
    for (const id of [userA, userB, userAdmin, userInactive])
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)', [
        id,
        `${id}@test.local`,
        JSON.stringify({ nome: 'Teste', perfil: 'admin' }),
      ]);
    await db.query('update public.usuarios set ativo=true where id<>$1', [userInactive]);
    await db.query("update public.usuarios set perfil='admin' where id=$1", [userAdmin]);
    async function identity(id: string, role = 'authenticated') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec(`set role ${role}`);
    }
    const employees = (
      await db.query<{ id: number }>(
        'select id from public.funcionarios where ativo and not is_status order by id limit 2',
      )
    ).rows;
    const vehicle = (
      await db.query<{ id: number }>("select id from public.veiculos where placa='BBE9E90'")
    ).rows[0].id;
    const contract = (
      await db.query<{ id: number }>("select id from public.contratos where nome='São Gonçalo'")
    ).rows[0].id;
    const teams = JSON.stringify(
      employees.map((e) => ({ responsavel_id: e.id, veiculo_id: vehicle })),
    );
    const saveReg = () =>
      db.query('select public.salvar_registro($1,$2,$3,$4)', [
        regId,
        '2026-09-10',
        contract,
        teams,
      ]);
    await t.test('seeds são repetíveis e status não é pessoa ativa', async () => {
      assert.equal(
        (await db.query<{ n: number }>('select count(*)::int n from veiculos')).rows[0].n,
        82,
      );
      const status = (
        await db.query<{ is_status: boolean; ativo: boolean }>(
          "select is_status,ativo from funcionarios where nome='Parado na Base'",
        )
      ).rows[0];
      assert.deepEqual(status, { is_status: true, ativo: false });
      assert.equal(
        (await db.query<{ perfil: string }>('select perfil from usuarios where id=$1', [userA]))
          .rows[0].perfil,
        'funcionario',
      );
    });
    await t.test('anônimo não lê nem grava', async () => {
      await identity('', 'anon');
      await assert.rejects(db.query('select * from veiculos'), /permission denied/);
      await assert.rejects(saveReg(), /permission denied/);
    });
    await t.test('inativo não vê catálogos nem grava', async () => {
      await identity(userInactive);
      assert.equal((await db.query('select * from veiculos')).rows.length, 0);
      await assert.rejects(saveReg(), /sem acesso ativo/);
    });
    await t.test('registro completo e nova tentativa geram apenas um envio', async () => {
      await identity(userA);
      await saveReg();
      await saveReg();
      assert.equal((await db.query('select * from registros_frota')).rows.length, 1);
      assert.equal((await db.query('select * from registro_equipes')).rows.length, 2);
    });
    await t.test('alteração do mesmo ID é rejeitada e funcionário não altera perfil', async () => {
      await assert.rejects(
        db.query('select salvar_registro($1,$2,$3,$4)', [regId, '2026-09-11', contract, teams]),
        /outros dados/,
      );
      await assert.rejects(
        db.query("update usuarios set perfil='admin' where id=$1", [userA]),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          'insert into registros_frota(id,data,contrato_id,numero_equipes,usuario_id) values ($1,$2,$3,1,$4)',
          ['20000000-0000-4000-8000-000000000099', '2026-09-10', contract, userA],
        ),
        /permission denied/,
      );
    });
    await t.test('equipe inválida não deixa pai ou filhos parciais', async () => {
      const before = (await db.query('select * from registros_frota')).rows.length;
      await assert.rejects(
        db.query('select salvar_registro($1,$2,$3,$4)', [
          '20000000-0000-4000-8000-000000000002',
          '2026-09-10',
          contract,
          JSON.stringify([
            { responsavel_id: employees[0].id, veiculo_id: vehicle },
            { responsavel_id: 999999, veiculo_id: vehicle },
          ]),
        ]),
        /ativos/,
      );
      assert.equal((await db.query('select * from registros_frota')).rows.length, before);
    });
    await t.test('manutenção valida custo, referências e repetição', async () => {
      const args = [maintId, '2026-09-10', 1, employees[0].id, contract, vehicle, 480];
      const sql = 'select salvar_manutencao($1,$2,$3,$4,$5,$6,$7)';
      await db.query(sql, args);
      await db.query(sql, args);
      assert.equal((await db.query('select * from manutencoes')).rows.length, 1);
      await assert.rejects(
        db.query(sql, ['30000000-0000-4000-8000-000000000002', ...args.slice(1, 6), -1]),
        /inválido/,
      );
    });
    await t.test('busca sem acento/hífen, filtro e paginação', async () => {
      const all = await db.query("select * from buscar_historico($1,21,0,'todos')", [
        'sao goncalo',
      ]);
      assert.equal(all.rows.length, 2);
      assert.equal(
        (await db.query("select * from buscar_historico('BBE-9E90',21,0,'manutencao')")).rows
          .length,
        1,
      );
      assert.equal(
        (await db.query("select * from buscar_historico('',1,1,'todos')")).rows.length,
        1,
      );
    });
    await t.test('outro funcionário não vê registros nem filhos', async () => {
      await identity(userB);
      assert.equal((await db.query('select * from registros_frota')).rows.length, 0);
      assert.equal((await db.query('select * from registro_equipes')).rows.length, 0);
      assert.equal((await db.query('select * from manutencoes')).rows.length, 0);
      assert.equal((await db.query('select * from buscar_historico()')).rows.length, 0);
      await assert.rejects(saveReg(), /outros dados/);
    });
    await t.test('administrador vê os envios; desativação bloqueia acesso', async () => {
      await identity(userAdmin);
      assert.equal((await db.query('select * from buscar_historico()')).rows.length, 2);
      await db.exec('reset role');
      await db.query('update usuarios set ativo=false where id=$1', [userA]);
      await identity(userA);
      assert.equal((await db.query('select * from buscar_historico()')).rows.length, 0);
      await assert.rejects(saveReg(), /sem acesso ativo/);
    });
  } finally {
    await db.close();
  }
});
