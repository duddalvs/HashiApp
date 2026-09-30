import { test, expect, type Page } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

const drivers = [
  { id: 101, nome: 'Ana Motorista', ativo: true, is_status: false },
  { id: 102, nome: 'Bruno Motorista', ativo: true, is_status: false },
];
const vehicles = [
  { id: 201, placa: 'AAA-1001', modelo: 'Caminhão A', tipo: 'veiculo', ativo: true },
  { id: 202, placa: 'BBB-2002', modelo: 'Caminhão B', tipo: 'veiculo', ativo: true },
];
async function enter(page: Page, lookup: (driverId: number, exclude: string) => Promise<unknown>) {
  const profile = {
    id: 'a1000000-0000-4000-8000-000000000001',
    nome: 'Teste',
    sobrenome: 'Veículo',
    login: 'teste',
    ativo: true,
    perfil: 'funcionario',
  };
  await page.route('**/rest/v1/**', async (route) => {
    const rpc = route.request().url().split('/').pop();
    if (rpc === 'autenticar_usuario')
      return route.fulfill({
        json: {
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          user: { id: profile.id },
          profile,
        },
      });
    if (rpc === 'meu_perfil') return route.fulfill({ json: profile });
    if (rpc === 'listar_catalogos')
      return route.fulfill({ json: { ...demoCatalogs, employees: drivers, vehicles } });
    if (rpc === 'ultimo_veiculo_motorista') {
      const args = route.request().postDataJSON();
      try {
        return await route.fulfill({
          json: await lookup(args.p_motorista_id, args.p_excluir_registro),
        });
      } catch {
        return route.fulfill({ status: 500, json: { message: 'Falha simulada' } });
      }
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill('teste');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaSomenteDeTeste123');
  await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('tab', { name: 'Registro', exact: true }).click();
}
async function driver(page: Page, name: string) {
  await page.getByRole('button', { name: /^Equipe 1 — Responsável:/ }).click();
  await page.getByRole('button', { name, exact: true }).click();
}
const plateField = (page: Page) =>
  page.getByRole('button', { name: /^Equipe 1 — Placa do veículo:/ });

test('lista abre durante consulta, sugestao exige toque, data e separacao intuitiva', async ({
  page,
}, info) => {
  let release!: (value: unknown) => void;
  const answer = new Promise((resolve) => {
    release = resolve;
  });
  const requests: string[] = [];
  await enter(page, async (_, exclude) => {
    requests.push(exclude);
    return answer;
  });
  await driver(page, 'Ana Motorista');
  await plateField(page).click();
  await expect(
    page.getByText('Consultando histórico… Você já pode escolher na lista abaixo.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'BBB-2002', exact: true })).toBeVisible();
  await expect(page.getByText('Todos os veículos', { exact: true })).toBeVisible();
  release({ vehicleId: 201, date: '2026-09-20' });
  const suggestion = page.getByRole('button', {
    name: 'Usar último veículo: AAA-1001',
    exact: true,
  });
  await expect(suggestion).toBeVisible();
  await expect(page.getByTestId('select-suggestion')).toContainText(
    'Último veículo deste motorista',
  );
  await expect(
    page.getByTestId('select-options').getByText('Último veículo deste motorista'),
  ).toHaveCount(0);
  await expect(suggestion).toContainText('Alocação de 20/09/2026');
  await expect(
    page.locator('[aria-label="Equipe 1 — Placa do veículo: Toque para selecionar"]'),
  ).toHaveCount(1);
  await page.screenshot({ path: info.outputPath('ultimo-veiculo.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await suggestion.click();
  await expect(plateField(page)).toHaveAccessibleName('Equipe 1 — Placa do veículo: AAA-1001');
  await expect(
    page.getByRole('textbox', { name: 'Pesquisar Equipe 1 — Placa do veículo' }),
  ).toHaveCount(0);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((id) => /^[0-9a-f-]{36}$/.test(id))).toBe(true);
  await plateField(page).click();
  await page
    .getByRole('textbox', { name: 'Pesquisar Equipe 1 — Placa do veículo' })
    .fill('bbb2002');
  await expect(suggestion).toHaveCount(0);
  await page.getByRole('button', { name: 'BBB-2002', exact: true }).click();
  await expect(plateField(page)).toHaveAccessibleName('Equipe 1 — Placa do veículo: BBB-2002');
});

test('seletor fecha por Escape, reabre sem pesquisa e mantem o historico separado da lista', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enter(page, async () => ({ vehicleId: 201, date: '2026-09-20' }));
  await driver(page, 'Ana Motorista');
  for (let attempt = 0; attempt < 4; attempt++) {
    await plateField(page).click();
    await expect(page.getByTestId('select-overlay')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Usar último veículo: AAA-1001' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Pesquisar Equipe 1 — Placa do veículo' }).fill('bbb');
    await expect(page.getByTestId('select-suggestion')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('select-overlay')).toHaveCount(0);
    await expect(plateField(page)).toHaveAccessibleName(
      'Equipe 1 — Placa do veículo: Toque para selecionar',
    );
  }
  await plateField(page).click();
  await page.getByRole('button', { name: 'Usar último veículo: AAA-1001' }).click();
  await page.getByRole('tab', { name: 'Manutenção', exact: true }).click();
  await expect(page.getByTestId('select-overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('troca de motorista ignora resposta atrasada do anterior e nao preenche veiculo', async ({
  page,
}) => {
  let release!: (value: unknown) => void;
  const oldAnswer = new Promise((resolve) => {
    release = resolve;
  });
  await enter(page, async (id) =>
    id === 101 ? oldAnswer : { vehicleId: 202, date: '2026-09-21' },
  );
  await driver(page, 'Ana Motorista');
  await driver(page, 'Bruno Motorista');
  await plateField(page).click();
  const correct = page.getByRole('button', { name: 'Usar último veículo: BBB-2002', exact: true });
  await expect(correct).toBeVisible();
  const staleResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/ultimo_veiculo_motorista') &&
      response.request().postDataJSON().p_motorista_id === 101,
  );
  release({ vehicleId: 201, date: '2026-09-20' });
  await staleResponse;
  await expect(correct).toBeVisible();
  await expect(page.getByRole('button', { name: 'Usar último veículo: AAA-1001' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar opções' }).click();
  await expect(plateField(page)).toHaveAccessibleName(
    'Equipe 1 — Placa do veículo: Toque para selecionar',
  );
});

test('historico indisponivel permite lista comum, nova tentativa e ausencia de historico', async ({
  page,
}) => {
  let fail = true;
  await enter(page, async () => {
    if (fail) throw new Error('Offline');
    return null;
  });
  await driver(page, 'Ana Motorista');
  await plateField(page).click();
  await expect(
    page.getByText('Não foi possível consultar o histórico.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'AAA-1001', exact: true })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(
    page.getByText('Nenhuma alocação anterior disponível para este motorista.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'AAA-1001', exact: true }).click();
  await expect(plateField(page)).toHaveAccessibleName('Equipe 1 — Placa do veículo: AAA-1001');
});
