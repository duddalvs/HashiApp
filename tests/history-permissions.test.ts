import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { normalizeLogin } from '../src/lib/login';

test('login aceita somente nome de usuário e normaliza a digitação', () => {
  assert.equal(normalizeLogin(' USER_ADMIN '), 'user_admin');
  assert.equal(normalizeLogin('user_pessoa1'), 'user_pessoa1');
  for (const value of ['', 'x', 'a b c', 'admin@', 'Nome@empresa.com', "user';--"])
    assert.throws(() => normalizeLogin(value));
});

test('edição e exclusão: proprietário, administrador, concorrência e cascata', async (t) => {
  const db = new PGlite();
  const owner = 'a1000000-0000-4000-8000-000000000001';
  const other = 'a1000000-0000-4000-8000-000000000002';
  const admin = 'a1000000-0000-4000-8000-000000000003';
  const reg = 'a2000000-0000-4000-8000-000000000001';
  const maint = 'a3000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    for (const file of readdirSync('supabase/migrations')
      .filter((f) => f.endsWith('.sql') && f < '202609150003')
      .sort())
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    for (const [index, id] of [owner, other, admin].entries())
      await db.query('insert into auth.users(id,email) values($1,$2)', [
        id,
        `user_test${index}@hashimoto.invalid`,
      ]);
    await db.exec('update usuarios set ativo=true');
    await db.query("update usuarios set perfil='admin' where id=$1", [admin]);
    await t.test('perfil sem email ou senha, login obrigatorio e estavel', async () => {
      const columns = (
        await db.query<{ column_name: string }>(
          "select column_name from information_schema.columns where table_schema='public' and table_name='usuarios'",
        )
      ).rows.map((row) => row.column_name);
      assert.ok(!columns.includes('email'));
      assert.ok(!columns.includes('senha'));
      await assert.rejects(
        db.query("update usuarios set login='outro_nome' where id=$1", [owner]),
        /nao pode ser alterado/,
      );
    });
    await t.test(
      'metadados do usuario nao concedem atividade ou perfil administrativo',
      async () => {
        const id = 'a1000000-0000-4000-8000-000000000004';
        await db.query(
          "insert into auth.users(id,email,raw_user_meta_data) values($1,'user_falso@hashimoto.invalid',$2)",
          [
            id,
            JSON.stringify({
              nome: 'Teste',
              hashi_perfil: 'admin',
              hashi_ativo: true,
              perfil: 'admin',
              ativo: true,
            }),
          ],
        );
        assert.deepEqual(
          (await db.query('select login,perfil,ativo from usuarios where id=$1', [id])).rows,
          [{ login: 'user_falso', perfil: 'funcionario', ativo: false }],
        );
        await db.query('delete from auth.users where id=$1', [id]);
      },
    );
    async function identity(id: string, role = 'authenticated') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec(`set role ${role}`);
    }
    const teams = JSON.stringify([{ responsavel_id: 2, veiculo_id: 2 }]);
    const editReg = (date: string, version = 1, list = teams) =>
      db.query('select editar_registro($1,$2,1,$3,$4)', [reg, date, list, version]);
    const editMaint = (cost: number, version = 1) =>
      db.query('select editar_manutencao($1,$2,1,2,1,2,$3,$4)', [
        maint,
        '2026-09-15',
        cost,
        version,
      ]);
    await identity(owner);
    await db.query('select salvar_registro($1,$2,1,$3)', [reg, '2026-09-15', teams]);
    await db.query('select salvar_manutencao($1,$2,1,2,1,2,480)', [maint, '2026-09-15']);
    await t.test(
      'proprietário lê IDs, edita e repete sem duplicar, preservando autoria',
      async () => {
        const data = (
          await db.query<{ data: { version: number; teams: unknown[] } }>(
            "select obter_envio($1,'registro') data",
            [reg],
          )
        ).rows[0].data;
        assert.equal(data.version, 1);
        assert.equal(data.teams.length, 1);
        await editReg('2026-09-16');
        await editReg('2026-09-16');
        await editMaint(500);
        await editMaint(500);
        const rows = (
          await db.query<{ usuario_id: string; versao: number }>(
            'select usuario_id,versao from registros_frota',
          )
        ).rows;
        assert.deepEqual(rows, [{ usuario_id: owner, versao: 2 }]);
        assert.equal((await db.query('select * from registro_equipes')).rows.length, 1);
      },
    );
    await t.test('versão antiga e referências inválidas não sobrescrevem o envio', async () => {
      await assert.rejects(editReg('2026-09-17'), /foi alterado/);
      await assert.rejects(editMaint(510), /foi alterado/);
      await assert.rejects(
        editReg('2026-09-17', 2, '[{"responsavel_id":99999,"veiculo_id":2}]'),
        /ativos/,
      );
      await assert.rejects(editMaint(-1, 2), /inválido/);
      assert.equal(
        (
          await db.query<{ data: { version: number } }>("select obter_envio($1,'registro') data", [
            reg,
          ])
        ).rows[0].data.version,
        2,
      );
    });
    await t.test('usuário comum não exclui nem muda permissões por chamada direta', async () => {
      await assert.rejects(
        db.query("select apagar_envio($1,'registro')", [reg]),
        /Somente administradores/,
      );
      await assert.rejects(
        db.query("select apagar_envio($1,'manutencao')", [maint]),
        /Somente administradores/,
      );
      await assert.rejects(
        db.query('delete from registros_frota where id=$1', [reg]),
        /permission denied/,
      );
      await assert.rejects(
        db.query('update manutencoes set custo=0 where id=$1', [maint]),
        /permission denied/,
      );
      await assert.rejects(
        db.query("update usuarios set login='user_admin',perfil='admin' where id=$1", [owner]),
        /permission denied/,
      );
    });
    await t.test('outro funcionário não obtém nem edita registros alheios', async () => {
      await identity(other);
      assert.equal(
        (await db.query<{ data: unknown }>("select obter_envio($1,'registro') data", [reg])).rows[0]
          .data,
        null,
      );
      await assert.rejects(editReg('2026-09-17', 2), /sem permissão/);
      await assert.rejects(editMaint(520, 2), /sem permissão/);
    });
    await t.test('anônimo e conta inativa não editam nem apagam', async () => {
      await identity('', 'anon');
      await assert.rejects(editMaint(520, 2), /permission denied/);
      await assert.rejects(
        db.query("select apagar_envio($1,'registro')", [reg]),
        /permission denied/,
      );
      await db.exec('reset role');
      await db.query('update usuarios set ativo=false where id=$1', [other]);
      await identity(other);
      await assert.rejects(editReg('2026-09-17', 2), /sem acesso ativo/);
      await assert.rejects(
        db.query("select apagar_envio($1,'registro')", [reg]),
        /Somente administradores/,
      );
    });
    await t.test(
      'administrador edita envio alheio e exclui pai, equipes e manutenção',
      async () => {
        await identity(admin);
        await editReg(
          '2026-09-18',
          2,
          JSON.stringify([
            { responsavel_id: 2, veiculo_id: 2 },
            { responsavel_id: 3, veiculo_id: 3 },
          ]),
        );
        await editMaint(550, 2);
        assert.equal(
          (await db.query<{ usuario_id: string }>('select usuario_id from manutencoes')).rows[0]
            .usuario_id,
          owner,
        );
        assert.equal((await db.query('select * from registro_equipes')).rows.length, 2);
        await db.query("select apagar_envio($1,'registro')", [reg]);
        await db.query("select apagar_envio($1,'registro')", [reg]);
        await db.query("select apagar_envio($1,'manutencao')", [maint]);
        assert.equal((await db.query('select * from buscar_historico()')).rows.length, 0);
        assert.equal((await db.query('select * from registro_equipes')).rows.length, 0);
        await assert.rejects(editReg('2026-09-19', 3), /não encontrado/);
      },
    );
  } finally {
    await db.close();
  }
});
