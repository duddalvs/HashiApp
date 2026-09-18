import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

test('acesso sem e-mail: migracao, senha, sessoes e autorizacao em cada operacao', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const owner = 'b1000000-0000-4000-8000-000000000001';
  const admin = 'b1000000-0000-4000-8000-000000000002';
  const reg = 'b2000000-0000-4000-8000-000000000001';
  const maint = 'b2000000-0000-4000-8000-000000000002';
  const password = 'SenhaLocalDeTeste!123';
  const json = async (sql: string, args: unknown[] = []) =>
    (await db.query<{ data: any }>(sql, args)).rows[0].data;
  const role = async (name = 'anon') => {
    await db.exec('reset role');
    await db.exec(`set role ${name}`);
  };
  const login = (name: string, pass = password) =>
    json('select autenticar_usuario($1,$2) data', [name, pass]);
  let userToken: string, adminToken: string;
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create schema extensions; create extension pgcrypto with schema extensions;
      create table auth.users(id uuid primary key,email text,encrypted_password text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
    const files = readdirSync('supabase/migrations')
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files.filter((f) => f < '202609150003'))
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    for (const [id, name] of [
      [owner, 'user_teste'],
      [admin, 'admin_teste'],
    ])
      await db.query(
        "insert into auth.users(id,email,encrypted_password) values($1,$2,extensions.crypt($3,extensions.gen_salt('bf',10)))",
        [id, `${name}@hashimoto.invalid`, password],
      );
    await db.exec(
      "update usuarios set ativo=true; update usuarios set perfil='admin' where login='admin_teste'",
    );
    await db.query(
      'insert into registros_frota(id,data,contrato_id,numero_equipes,usuario_id) values($1,$2,1,1,$3)',
      [reg, '2026-09-15', owner],
    );
    await db.query(
      'insert into registro_equipes(registro_frota_id,numero_equipe,responsavel_id,veiculo_id) values($1,1,2,2)',
      [reg],
    );
    for (const file of files.filter((f) => f >= '202609150003'))
      await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    await t.test('migra identidades, senhas e envios e remove contas Auth', async () => {
      assert.equal((await db.query('select * from auth.users')).rows.length, 0);
      assert.equal((await db.query('select * from usuarios')).rows.length, 2);
      assert.deepEqual(
        (await db.query('select usuario_id from registros_frota where id=$1', [reg])).rows,
        [{ usuario_id: owner }],
      );
      await role();
      const u = await login(' USER_TESTE '),
        a = await login('admin_teste');
      assert.equal(u.user.id, owner);
      assert.equal(a.profile.perfil, 'admin');
      userToken = u.token;
      adminToken = a.token;
      assert.match(userToken, /^[a-f0-9]{64}$/);
      assert.ok(!JSON.stringify(u.profile).includes('senha'));
      assert.ok(!('email' in u.profile));
      assert.equal(
        (await login('user_teste@hashimoto.invalid')).error,
        'Usuário ou senha incorretos.',
      );
    });
    await t.test(
      'nenhum cliente acessa hashes, tokens armazenados ou cadastro administrativo',
      async () => {
        for (const name of ['anon', 'authenticated']) {
          await role(name);
          await assert.rejects(db.query('select * from private.credenciais'), /permission denied/);
          await assert.rejects(db.query('select * from private.sessoes'), /permission denied/);
          await assert.rejects(db.query('select * from usuarios'), /permission denied/);
          await assert.rejects(
            db.query("select cadastrar_usuario('invasor','SenhaLocalTeste123','admin')"),
            /permission denied/,
          );
          await assert.rejects(
            db.query("select definir_senha_usuario('user_teste','SenhaLocalTeste123')"),
            /permission denied/,
          );
          await assert.rejects(
            db.query("select private.apagar_envio($1,'registro')", [reg]),
            /permission denied/,
          );
        }
        await role();
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
        await assert.rejects(
          db.query('select meu_perfil($1)', ['0'.repeat(64)]),
          /Sessão expirada/,
        );
        await assert.rejects(db.query('select listar_catalogos(null)'), /Sessão expirada/);
      },
    );
    await t.test('funcionario le e edita seus envios; administrador ve todos e apaga', async () => {
      const teams = JSON.stringify([{ responsavel_id: 2, veiculo_id: 2 }]);
      await db.query('select editar_registro($1,$2,$3,1,$4,1)', [
        userToken,
        reg,
        '2026-09-16',
        teams,
      ]);
      await db.query('select editar_registro($1,$2,$3,1,$4,1)', [
        userToken,
        reg,
        '2026-09-16',
        teams,
      ]);
      await assert.rejects(
        db.query('select editar_registro($1,$2,$3,1,$4,1)', [userToken, reg, '2026-09-17', teams]),
        /foi alterado/,
      );
      await db.query('select salvar_manutencao($1,$2,$3,1,2,1,2,50)', [
        adminToken,
        maint,
        '2026-09-15',
      ]);
      assert.equal(
        await json("select obter_envio($1,$2,'manutencao') data", [userToken, maint]),
        null,
      );
      assert.equal(
        (await db.query('select * from buscar_historico($1)', [userToken])).rows.length,
        1,
      );
      assert.equal(
        (await db.query('select * from buscar_historico($1)', [adminToken])).rows.length,
        2,
      );
      await assert.rejects(
        db.query('select editar_manutencao($1,$2,$3,1,2,1,2,70,1)', [
          userToken,
          maint,
          '2026-09-15',
        ]),
        /sem permissão/,
      );
      await assert.rejects(
        db.query("select apagar_envio($1,$2,'registro')", [userToken, reg]),
        /Somente administradores/,
      );
      await db.query('select editar_registro($1,$2,$3,1,$4,2)', [
        adminToken,
        reg,
        '2026-09-17',
        teams,
      ]);
      await db.query("select apagar_envio($1,$2,'registro')", [adminToken, reg]);
      await role('postgres');
      assert.equal(
        (await db.query('select * from registro_equipes where registro_frota_id=$1', [reg])).rows
          .length,
        0,
      );
    });
    await t.test('cadastro SQL atomico sem Auth e senha protegida', async () => {
      await assert.rejects(
        db.query("select cadastrar_usuario('ab','SenhaLocalTeste123')"),
        /inválido/,
      );
      await assert.rejects(db.query("select cadastrar_usuario('novo','curta')"), /12 caracteres/);
      await assert.rejects(
        db.query("select cadastrar_usuario('novo','SenhaLocalTeste123','dono')"),
        /inválido/,
      );
      await assert.rejects(
        db.query('select cadastrar_usuario($1,$2)', ['sem_nome', password]),
        /Informe o nome/,
      );
      await assert.rejects(
        db.query("select cadastrar_usuario($1,$2,'funcionario','Maria Eduarda',' ')", [
          'sem_sobrenome',
          password,
        ]),
        /Informe o sobrenome/,
      );
      await assert.rejects(
        db.query("select cadastrar_usuario($1,$2,'funcionario','Maria Eduarda',$3)", [
          'nome_longo',
          password,
          'a'.repeat(101),
        ]),
        /sobrenome/,
      );
      await db.query("select cadastrar_usuario($1,$2,'funcionario',' Maria Eduarda ',' Alves ')", [
        'user_novo',
        password,
      ]);
      await assert.rejects(
        db.query("select cadastrar_usuario($1,$2,'funcionario','Maria Eduarda','Alves')", [
          'user_novo',
          password,
        ]),
        /já existe/,
      );
      const hash = (
        await db.query<{ senha_hash: string }>(
          "select senha_hash from private.credenciais c join usuarios u on u.id=c.usuario_id where login='user_novo'",
        )
      ).rows[0].senha_hash;
      assert.match(hash, /^\$2a\$12\$/);
      assert.notEqual(hash, password);
      await db.exec('begin');
      await db.query("select cadastrar_usuario($1,$2,'funcionario','Teste','Rollback')", [
        'user_rollback',
        password,
      ]);
      await db.exec('rollback');
      assert.equal(
        (await db.query("select * from usuarios where login='user_rollback'")).rows.length,
        0,
      );
      assert.equal((await db.query('select * from auth.users')).rows.length, 0);
      await role();
      const created = await login('user_novo');
      assert.equal(created.profile.perfil, 'funcionario');
      assert.equal(created.profile.nome, 'Maria Eduarda');
      assert.equal(created.profile.sobrenome, 'Alves');
      assert.equal((await json('select meu_perfil($1) data', [created.token])).sobrenome, 'Alves');
    });
    await t.test('tentativas erradas sao contadas e bloqueio e limitado no tempo', async () => {
      for (let i = 0; i < 10; i++)
        assert.equal((await login('user_novo', 'errada')).error, 'Usuário ou senha incorretos.');
      assert.match((await login('user_novo')).error, /15 minutos/);
      await role('postgres');
      await db.exec("update private.tentativas_login set inicio=now()-interval '16 minutes'");
      await role();
      assert.ok((await login('user_novo')).token);
    });
    await t.test('logout, expiracao, desativacao e redefinicao revogam acesso', async () => {
      await db.query('select encerrar_sessao($1)', [userToken]);
      await assert.rejects(db.query('select meu_perfil($1)', [userToken]), /Sessão expirada/);
      userToken = (await login('user_teste')).token;
      await role('postgres');
      await db.query(
        "update private.sessoes set expires_at=now()-interval '1 second' where token_hash=extensions.digest($1,'sha256')",
        [userToken],
      );
      await role();
      await assert.rejects(db.query('select meu_perfil($1)', [userToken]), /Sessão expirada/);
      userToken = (await login('user_teste')).token;
      await role('postgres');
      await db.query('update usuarios set ativo=false where id=$1', [owner]);
      await role();
      await assert.rejects(db.query('select meu_perfil($1)', [userToken]), /Sessão expirada/);
      await role('postgres');
      await db.query('update usuarios set ativo=true where id=$1', [owner]);
      await role();
      await assert.rejects(db.query('select meu_perfil($1)', [userToken]), /Sessão expirada/);
      userToken = (await login('user_teste')).token;
      await role('postgres');
      await db.query('select definir_senha_usuario($1,$2)', [
        'user_teste',
        'OutraSenhaLocalTeste!123',
      ]);
      await role();
      await assert.rejects(db.query('select meu_perfil($1)', [userToken]), /Sessão expirada/);
      assert.ok((await login('user_teste')).error);
      assert.ok((await login('user_teste', 'OutraSenhaLocalTeste!123')).token);
    });
    await t.test(
      'recuperacao exige codigo valido, expira, limita erros e revoga sessoes',
      async () => {
        await role('postgres');
        const id = await json(
          "select cadastrar_usuario('user_recuperacao',$1,'funcionario','Teste','Recuperacao') data",
          [password],
        );
        let code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        assert.match(code, /^[A-F0-9]{4}(-[A-F0-9]{4}){3}$/);
        await role();
        await assert.rejects(
          db.query("select gerar_codigo_recuperacao('user_recuperacao')"),
          /permission denied/,
        );
        await assert.rejects(
          db.query('select * from private.recuperacoes_senha'),
          /permission denied/,
        );
        const verify = (value: string, name = 'user_recuperacao') =>
          json('select validar_codigo_recuperacao($1,$2) data', [name, value]);
        const reset = (value: string, pass = password + 'Novo') =>
          json('select recuperar_senha($1,$2) data', [value, pass]);
        const session = (await login('user_recuperacao')).token;
        assert.equal((await verify('errado', 'nao_existe')).error, (await verify('errado')).error);
        for (let i = 0; i < 4; i++) assert.ok((await verify('errado')).error);
        assert.ok((await verify(code)).error);
        assert.ok(
          (await login('user_recuperacao')).token,
          'Erros no codigo nao bloqueiam login normal',
        );
        await role('postgres');
        const oldCode = code;
        code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        await role();
        assert.ok((await verify(oldCode)).error);
        let token = (await verify(code.toLowerCase())).token;
        assert.ok(token);
        assert.ok((await verify(code)).error, 'Codigo usado nao pode criar outra autorizacao');
        await assert.rejects(db.query('select meu_perfil($1)', [token]), /Sessão expirada/);
        assert.ok(
          (await reset(session)).error,
          'Sessao normal nao substitui autorizacao de recuperacao',
        );
        assert.ok((await reset(token, 'curta')).error);
        assert.equal((await reset(token)).success, true);
        assert.ok((await reset(token)).error);
        await assert.rejects(db.query('select meu_perfil($1)', [session]), /Sessão expirada/);
        assert.ok((await login('user_recuperacao')).error);
        assert.ok((await login('user_recuperacao', password + 'Novo')).token);
        await role('postgres');
        code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        await db.query(
          "update private.recuperacoes_senha set expira_em=now()-interval '1 second' where usuario_id=$1",
          [id],
        );
        await role();
        assert.ok((await verify(code)).error);
        await role('postgres');
        code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        await role();
        token = (await verify(code)).token;
        await role('postgres');
        await db.query(
          "update private.recuperacoes_senha set token_expira_em=now()-interval '1 second' where usuario_id=$1",
          [id],
        );
        await role();
        assert.equal((await reset(token)).expired, true);
        await role('postgres');
        code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        await role();
        token = (await verify(code)).token;
        await role('postgres');
        await db.query('select definir_senha_usuario($1,$2)', ['user_recuperacao', password]);
        await role();
        assert.ok((await reset(token)).error);
        await role('postgres');
        code = await json("select gerar_codigo_recuperacao('user_recuperacao') data");
        await db.query('update usuarios set ativo=false where id=$1', [id]);
        await db.query('update usuarios set ativo=true where id=$1', [id]);
        await role();
        assert.ok((await verify(code)).error);
      },
    );
  } finally {
    await db.close();
  }
});
