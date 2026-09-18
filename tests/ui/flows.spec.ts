import { test, expect, type Page } from '@playwright/test';
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});
async function enter(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Conhecer as telas' }).click();
  await expect(page.getByText('O que vamos registrar hoje?')).toBeVisible();
}
async function select(page: Page, label: string, query: string, option: string) {
  await page.getByRole('button', { name: new RegExp(`^${label}:`) }).click();
  await page.getByRole('textbox', { name: `Pesquisar ${label}`, exact: true }).fill(query);
  await page.getByRole('button', { name: option, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fechar opções', exact: true })).toHaveCount(0);
}

test('datas futuras sao recusadas na entrada dos dois formularios', async ({ page }) => {
  await enter(page);
  const dates = await page.evaluate(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { today: iso(now), tomorrow: iso(tomorrow) };
  });
  for (const tab of ['Registro', 'Manutenção']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    const date = page.getByLabel('Data', { exact: true });
    await expect(date).toHaveAttribute('max', dates.today);
    await date.fill(dates.tomorrow);
    await expect(date).toHaveValue(dates.today);
    await expect(
      page.getByText('A data não pode ser posterior a hoje.', { exact: true }),
    ).toBeVisible();
    await date.fill('2026-01-01');
    await expect(date).toHaveValue('2026-01-01');
    await expect(
      page.getByText('A data não pode ser posterior a hoje.', { exact: true }),
    ).toHaveCount(0);
    await date.fill(dates.today);
    await expect(date).toHaveValue(dates.today);
  }
});

test('motorista nao identificado, Outros, ordem dos campos e edicao', async ({ page }) => {
  await enter(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('tab', { name: 'Manutenção', exact: true }).click();
  const fields = [
    page.getByLabel('Data', { exact: true }),
    page.getByRole('button', { name: /^Contrato:/ }),
    page.getByRole('button', { name: /^Placa:/ }),
    page.getByRole('button', { name: /^Motorista:/ }),
    page.getByRole('button', { name: /^Tipo de manutenção:/ }),
    page.getByRole('textbox', { name: 'Valor', exact: true }),
  ];
  const positions = await Promise.all(fields.map(async (field) => (await field.boundingBox())!.y));
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await select(page, 'Placa', 'BBE9E90', 'BBE9E90');
  await select(page, 'Tipo de manutenção', 'outros', 'Outros');
  await select(page, 'Contrato', 'mage', 'Magé');
  await page.getByRole('textbox', { name: 'Valor', exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Salvar manutenção', exact: true }).click();
  await expect(
    page.getByText('Escolha um motorista ou marque Motorista não identificado.'),
  ).toBeVisible();
  await select(page, 'Motorista', 'joao', 'João — exemplo');
  const checkbox = page.getByRole('checkbox', { name: 'Motorista não identificado', exact: true });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Motorista: Motorista não identificado', exact: true }),
  ).toBeDisabled();
  await page.getByRole('tab', { name: 'Registro', exact: true }).click();
  await page.getByRole('tab', { name: 'Manutenção', exact: true }).click();
  await expect(checkbox).toBeChecked();
  await page.getByRole('button', { name: 'Salvar manutenção', exact: true }).click();
  await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
  await expect(page.getByText('Outros', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Ver detalhes/ }).click();
  await expect(
    page.getByText('Motorista: Motorista não identificado', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).toBeChecked();
  const today = await page.getByLabel('Data', { exact: true }).inputValue();
  await page.getByLabel('Data', { exact: true }).fill('2099-01-01');
  await expect(page.getByLabel('Data', { exact: true })).toHaveValue(today);
  await checkbox.click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(
    page.getByText('Escolha um motorista ou marque Motorista não identificado.'),
  ).toBeVisible();
  await select(page, 'Motorista', 'maria', 'Maria — exemplo');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('button', { name: /^Motorista: Maria/ })).toBeVisible();
  await checkbox.click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).toBeChecked();
});
test('menu inicial, dois botões no rodapé e histórico pelo menu', async ({ page }) => {
  await enter(page);
  await expect(page.getByRole('tab')).toHaveCount(2);
  await expect(page.getByRole('tab', { name: 'Registro' })).toBeVisible();
  const registration = await page
    .getByRole('button', { name: 'Alocação, Equipe e veículo', exact: true })
    .boundingBox();
  const maintenance = await page
    .getByRole('button', { name: 'Manutenção, Serviço e custo', exact: true })
    .boundingBox();
  expect(registration!.y).toBe(maintenance!.y);
  expect(registration!.x).toBeLessThan(maintenance!.x);
  await page.screenshot({ path: 'docs/screenshots/inicio.png', fullPage: true });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByText('Sua conta', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Histórico', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abrir histórico', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir opções da conta' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registros', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Manutenções', exact: true }).click();
  await expect(page.getByText('Serviços de manutenção', { exact: true })).toBeVisible();
  await expect(page.getByText('Seu histórico começa aqui')).toBeVisible();
});
test('equipes dinâmicas, seleção obrigatória, salvar e buscar no histórico', async ({ page }) => {
  await enter(page);
  await page.getByRole('tab', { name: 'Registro', exact: true }).click();
  await page.getByRole('button', { name: /^Contrato:/ }).click();
  await page.getByRole('textbox', { name: 'Pesquisar Contrato', exact: true }).fill('sao');
  await page.getByRole('button', { name: 'Fechar opções' }).click();
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Escolha um contrato da lista.')).toBeVisible();
  await select(page, 'Contrato', 'sao', 'São Gonçalo');
  await page.getByRole('button', { name: 'Adicionar equipe', exact: true }).click();
  await expect(page.getByText('EQUIPE 2', { exact: true })).toBeVisible();
  for (const n of [1, 2]) {
    await select(page, `Equipe ${n} — Responsável`, 'joao', 'João — exemplo');
    await select(page, `Equipe ${n} — Placa do veículo`, 'BBE9E90', 'BBE9E90');
  }
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Confira as equipes', { exact: true })).toBeVisible();
  await expect(page.getByText(/Funcionário: João — exemplo\. Equipes: 1, 2\./)).toBeVisible();
  await expect(page.getByText(/Veículo: BBE9E90\. Equipes: 1, 2\./)).toBeVisible();
  await expect(page.getByText('Exemplo salvo nesta sessão')).toHaveCount(0);
  await page.getByRole('button', { name: 'Corrigir equipes' }).click();
  await select(page, 'Equipe 2 — Responsável', 'maria', 'Maria — exemplo');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Confira as equipes', { exact: true })).toBeVisible();
  await expect(page.getByText(/Veículo: BBE9E90\. Equipes: 1, 2\./)).toBeVisible();
  await expect(page.getByText(/Funcionário: João — exemplo/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Corrigir equipes' }).click();
  await select(page, 'Equipe 2 — Placa do veículo', 'BBE9E35', 'BBE9E35');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByText('Exemplo salvo nesta sessão')).toBeVisible();
  await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
  await expect(page.getByText('Registro de 2 equipes')).toBeVisible();
  await page.getByRole('button', { name: 'Apagar registro', exact: true }).click();
  await expect(page.getByText('Acesso negado', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Somente administradores podem fazer esse tipo de ação.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar exclusão', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await expect(page.getByText('Registro de 2 equipes')).toBeVisible();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(page.getByText('Editar registro', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Contrato: São Gonçalo/ })).toBeVisible();
  await page.getByRole('button', { name: 'Remover equipe 2', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
  await expect(page.getByText('Registro de equipe', { exact: true })).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Buscar por placa ou contrato', exact: true })
    .fill('sao');
  await expect(page.getByText('Registro de equipe', { exact: true })).toBeVisible();
});
test('placa preenche modelo somente leitura, limpar apaga modelo e moeda salva', async ({
  page,
}) => {
  await enter(page);
  await page.getByRole('tab', { name: 'Manutenção', exact: true }).click();
  await select(page, 'Tipo de manutenção', 'preventiva', 'Preventiva');
  await select(page, 'Motorista', 'joao', 'João — exemplo');
  await select(page, 'Contrato', 'mage', 'Magé');
  await select(page, 'Placa', 'BBE9E35', 'BBE9E35');
  await expect(page.getByRole('textbox', { name: 'Modelo do veículo', exact: true })).toHaveValue(
    'PENDENTE - ALTERAR 1',
  );
  await expect(
    page.getByRole('textbox', { name: 'Modelo do veículo', exact: true }),
  ).not.toBeEditable();
  await page.getByRole('button', { name: /^Placa:/ }).click();
  await page.getByRole('button', { name: 'Limpar seleção', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Modelo do veículo', exact: true })).toHaveValue(
    '',
  );
  await select(page, 'Placa', 'BBE-9E90', 'BBE9E90');
  await page.getByRole('textbox', { name: 'Valor', exact: true }).fill('48000');
  await expect(page.getByRole('textbox', { name: 'Valor', exact: true })).toHaveValue(/480,00/);
  await page.getByText('Manutenção da Frota', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/manutencao.png', fullPage: true });
  await page.getByRole('button', { name: 'Salvar manutenção', exact: true }).click();
  await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
  await expect(page.getByText('Preventiva', { exact: true })).toBeVisible();
  await expect(page.getByText(/R\$\s*480,00/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manutenções', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Registros', exact: true }).click();
  await expect(page.getByText('Preventiva', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Manutenções', exact: true }).click();
  await expect(page.getByText('Preventiva', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Manutenções', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.screenshot({ path: 'docs/screenshots/historico.png', fullPage: true });
});
