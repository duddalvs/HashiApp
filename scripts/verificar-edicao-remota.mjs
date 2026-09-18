import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { chromium, devices, expect } from '@playwright/test';

// Credenciais recebidas apenas no ambiente do processo pelo wrapper PowerShell.
// Cria e remove somente os UUIDs temporarios abaixo; nao altera envios existentes.
const accounts = JSON.parse(process.env.HASHI_TEST_ACCOUNTS || '[]');
assert.equal(accounts.length, 2, 'Execute scripts/verificar-edicao-remota.ps1.');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const baseURL = process.env.HASHI_TEST_URL || 'http://localhost:8085';
const clients = new Map();
const fixtureIds = { registro: randomUUID(), manutencao: randomUUID(), outro: randomUUID() };
let browser;
async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  assert.equal(result.error, null, `${name}: ${result.error?.message}`);
  return result.data;
}
async function loginPage(account) {
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${baseURL}/login`);
  await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(account.login);
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
  await expect(page.getByText('O que vamos registrar hoje?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.getByRole('button', { name: 'Histórico', exact: true }).click();
  return { context, page };
}
try {
  for (const account of accounts) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.rpc('autenticar_usuario', {
      p_usuario: account.login,
      p_senha: account.password,
    });
    assert.equal(error, null, `Login: ${account.login}`);
    assert.ok(data?.token, `Login por usuario: ${account.login}`);
    clients.set(account.login, {
      rpc: (name, args = {}) => client.rpc(name, { ...args, p_token: data.token }),
      from: (name) => client.from(name),
      logout: () => client.rpc('encerrar_sessao', { p_token: data.token }),
    });
  }
  const admin = clients.get('user_admin');
  const normal = clients.get('user_pessoa1');
  const catalogs = await rpc(normal, 'listar_catalogos');
  const person = catalogs.employees[0];
  const vehicle = catalogs.vehicles[0];
  const contract = catalogs.contracts[0];
  const type = catalogs.maintenanceTypes[0];
  const reg = {
    p_id: fixtureIds.registro,
    p_data: '2001-02-03',
    p_contrato_id: contract.id,
    p_equipes: [{ responsavel_id: person.id, veiculo_id: vehicle.id }],
  };
  const maint = {
    p_id: fixtureIds.manutencao,
    p_data: '2001-02-03',
    p_tipo_id: type.id,
    p_motorista_id: person.id,
    p_contrato_id: contract.id,
    p_veiculo_id: vehicle.id,
    p_custo: 1.23,
  };
  await rpc(normal, 'salvar_registro', reg);
  await rpc(normal, 'salvar_manutencao', maint);
  await rpc(admin, 'salvar_registro', { ...reg, p_id: fixtureIds.outro });
  await rpc(normal, 'editar_registro', { ...reg, p_data: '2001-02-04', p_versao: 1 });
  assert.ok(
    (await normal.rpc('apagar_envio', { p_id: fixtureIds.registro, p_tipo: 'registro' })).error,
  );
  assert.ok(
    (await normal.rpc('editar_registro', { ...reg, p_id: fixtureIds.outro, p_versao: 1 })).error,
  );
  assert.equal(
    await rpc(normal, 'obter_envio', { p_id: fixtureIds.outro, p_tipo: 'registro' }),
    null,
  );
  assert.ok(
    (await normal.from('usuarios').update({ perfil: 'admin' }).eq('login', 'user_pessoa1')).error,
  );
  console.log(
    'API: login dos dois perfis, edicao propria e bloqueios de exclusao/acesso/escalacao aprovados.',
  );

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const normalUI = await loginPage(accounts.find((a) => a.login === 'user_pessoa1'));
  const normalCard = normalUI.page.getByTestId(`history-manutencao-${fixtureIds.manutencao}`);
  await expect(normalCard).toBeVisible();
  await normalUI.page.reload();
  await expect(normalCard).toBeVisible();
  await normalCard.getByRole('button', { name: 'Apagar registro', exact: true }).click();
  await expect(normalUI.page.getByText('Acesso negado', { exact: true })).toBeVisible();
  await expect(
    normalUI.page.getByText('Somente administradores podem fazer esse tipo de ação.', {
      exact: true,
    }),
  ).toBeVisible();
  await normalUI.page.getByRole('button', { name: 'Entendi', exact: true }).click();
  assert.ok(
    await rpc(normal, 'obter_envio', { p_id: fixtureIds.manutencao, p_tipo: 'manutencao' }),
  );
  await expect(normalUI.page.getByTestId(`history-registro-${fixtureIds.outro}`)).toHaveCount(0);
  await normalCard.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(normalUI.page.getByRole('textbox', { name: 'Valor', exact: true })).toHaveValue(
    /1,23/,
  );
  await normalUI.page.getByRole('textbox', { name: 'Valor', exact: true }).fill('999');
  await normalUI.page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
  assert.equal(
    (await rpc(normal, 'obter_envio', { p_id: fixtureIds.manutencao, p_tipo: 'manutencao' }))
      .costDigits,
    '123',
  );
  await normalCard.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await normalUI.page.getByRole('textbox', { name: 'Valor', exact: true }).fill('234');
  await normalUI.page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(normalUI.page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
  assert.equal(
    (await rpc(normal, 'obter_envio', { p_id: fixtureIds.manutencao, p_tipo: 'manutencao' }))
      .costDigits,
    '234',
  );
  await normalUI.context.close();
  console.log(
    'Interface usuario comum: login, editar/salvar/cancelar e aviso de acesso negado ao apagar aprovados.',
  );

  const adminUI = await loginPage(accounts.find((a) => a.login === 'user_admin'));
  const adminCard = adminUI.page.getByTestId(`history-manutencao-${fixtureIds.manutencao}`);
  await expect(adminCard).toBeVisible();
  await adminCard.getByRole('button', { name: 'Apagar registro', exact: true }).click();
  await expect(adminUI.page.getByText('Apagar este registro?', { exact: true })).toBeVisible();
  await adminUI.page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  assert.ok(await rpc(admin, 'obter_envio', { p_id: fixtureIds.manutencao, p_tipo: 'manutencao' }));
  await adminCard.getByRole('button', { name: 'Apagar registro', exact: true }).click();
  await adminUI.page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(adminUI.page.getByText('Registro apagado.', { exact: true })).toBeVisible();
  await expect(adminCard).toHaveCount(0);
  assert.equal(
    await rpc(admin, 'obter_envio', { p_id: fixtureIds.manutencao, p_tipo: 'manutencao' }),
    null,
  );
  await rpc(admin, 'editar_registro', { ...reg, p_data: '2001-02-05', p_versao: 2 });
  await rpc(admin, 'apagar_envio', { p_id: fixtureIds.registro, p_tipo: 'registro' });
  assert.equal(
    await rpc(admin, 'obter_envio', { p_id: fixtureIds.registro, p_tipo: 'registro' }),
    null,
  );
  await adminUI.context.close();
  console.log(
    'Administrador: edicao de envio alheio, confirmacao/cancelamento e exclusao real aprovados.',
  );
} finally {
  if (browser) await browser.close();
  const admin = clients.get('user_admin');
  if (admin) {
    for (const [name, id] of Object.entries(fixtureIds)) {
      await rpc(admin, 'apagar_envio', {
        p_id: id,
        p_tipo: name === 'manutencao' ? 'manutencao' : 'registro',
      });
    }
    console.log('Todos os envios temporarios do teste foram removidos.');
  }
  for (const client of clients.values()) {
    await client.logout();
    assert.equal((await client.rpc('meu_perfil')).error?.code, '28000');
  }
}
