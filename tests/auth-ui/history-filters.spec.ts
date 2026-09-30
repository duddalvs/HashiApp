import { test, expect } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

for (const kind of ['registro', 'manutencao'] as const) {
  test(`multiplas selecoes, datas diretas, nomes completos e paginacao: ${kind}`, async ({
    page,
  }) => {
    const profile = {
      id: 'c1000000-0000-4000-8000-000000000001',
      nome: 'Lucas',
      sobrenome: 'Teste',
      login: 'user_admin',
      perfil: 'admin',
      ativo: true,
    };
    const author = 'c1000000-0000-4000-8000-000000000002';
    const author2 = 'c1000000-0000-4000-8000-000000000003';
    const requests: Record<string, any>[] = [];
    const errors: string[] = [];
    let failOptions = true;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/rest/v1/**', async (route) => {
      const rpc = route.request().url().split('/').pop();
      const body = route.request().postDataJSON();
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
      if (rpc === 'listar_catalogos') return route.fulfill({ json: demoCatalogs });
      if (rpc === 'opcoes_filtros_historico_completas') {
        if (failOptions) {
          failOptions = false;
          return route.fulfill({ status: 503, json: { message: 'Failed to fetch' } });
        }
        return route.fulfill({
          json: {
            drivers: [
              { id: 2, nome: 'Carlos Eduardo' },
              { id: 3, nome: 'Wallace' },
            ],
            vehicles: [
              { id: 2, placa: 'ABC1D23', modelo: 'Caminhão' },
              { id: 3, placa: 'DEF4G56', modelo: 'Caminhão' },
            ],
            contracts: [
              { id: 2, nome: 'Caxias' },
              { id: 3, nome: 'Saquarema' },
            ],
            authors: [
              { id: author, nome: 'Eduardo', sobrenome: 'Alves Germano', login: 'user_eduardo' },
              {
                id: author2,
                nome: 'Wallace',
                sobrenome: 'Felizardo de Queiroz',
                login: 'user_wallace',
              },
            ],
            maintenanceTypes: [
              { id: 2, nome: 'Revisão' },
              { id: 3, nome: 'Troca de óleo' },
            ],
          },
        });
      }
      if (rpc === 'filtrar_historico_multiplos') {
        requests.push(body);
        const filtered = body.p_veiculo_ids.includes(2);
        const rows = Array.from({ length: filtered ? 22 : 1 }, (_, i) => ({
          id: `c2000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
          tipo: body.p_tipo,
          data: filtered ? '2026-01-15' : '2026-09-25',
          contrato: filtered ? 'Contrato antigo' : 'Contrato recente',
          placas: [filtered ? 'ABC1D23' : 'BBE9E90'],
          detalhes: [
            {
              equipe: body.p_tipo === 'registro' ? 1 : undefined,
              servico: 'Revisão',
              responsavel: 'Carlos Eduardo',
              placa: filtered ? 'ABC1D23' : 'BBE9E90',
              modelo: 'Caminhão',
            },
          ],
          custo: body.p_tipo === 'registro' ? null : 10,
          created_at: '2026-09-30T13:00:00Z',
          autor_nome: 'Maria Eduarda',
        }));
        return route.fulfill({ json: rows.slice(body.p_offset, body.p_offset + body.p_limite) });
      }
      return route.fulfill({ status: 400, json: { message: 'RPC inesperada' } });
    });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(profile.login);
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SomenteTeste!123');
    await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('button', { name: 'Histórico', exact: true }).click();
    await page
      .getByRole('button', { name: kind === 'registro' ? 'Registros' : 'Manutenções', exact: true })
      .click();
    await expect(page.getByText('Contrato recente', { exact: true })).toBeVisible();
    expect(requests.at(-1)?.p_data_de).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(requests.at(-1)?.p_data_ate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(requests.at(-1)).not.toHaveProperty('p_periodo');
    expect(requests.at(-1)).not.toHaveProperty('p_campo_data');
    await expect(page.getByText('Data do registro: 25/09/2026', { exact: true })).toBeVisible();
    await expect(page.getByText(/^Lançado em 30\/09\/2026/)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Buscar por placa ou contrato' })).toHaveCount(
      0,
    );
    await expect(page.getByText(/Para consultar lançamentos mais antigos/)).toBeVisible();
    await page.screenshot({
      path: `test-results/history-multiple-${kind}-closed.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Ajustar filtros', exact: true }).click();
    await page.getByRole('button', { name: /Tentar novamente/ }).click();
    await expect(page.getByRole('button', { name: /^Placa:/ })).toBeEnabled();
    async function select(label: string, ...options: string[]) {
      await page.getByRole('button', { name: new RegExp(`^${label}:`) }).click();
      for (const option of options) {
        await page.getByRole('textbox', { name: `Pesquisar ${label}`, exact: true }).fill(option);
        const checkbox = page.getByRole('checkbox', { name: option, exact: true });
        await checkbox.click();
        await expect(checkbox).toBeChecked();
      }
      await page.getByRole('textbox', { name: `Pesquisar ${label}`, exact: true }).fill('');
      for (const option of options)
        await expect(page.getByRole('checkbox', { name: option, exact: true })).toBeChecked();
      if (label === 'Lançado por')
        await page.screenshot({
          path: `test-results/history-multiple-${kind}-authors.png`,
          fullPage: true,
        });
      await page.getByRole('button', { name: /^Concluir seleção/ }).click();
    }
    await expect(page.getByRole('button', { name: /^Período:|^Filtrar data por:/ })).toHaveCount(0);
    await expect(page.getByLabel('Data inicial', { exact: true })).toHaveValue(
      requests.at(-1)?.p_data_de,
    );
    await expect(page.getByLabel('Data final', { exact: true })).toHaveValue(
      requests.at(-1)?.p_data_ate,
    );
    await expect(page.getByText(/^Sem data inicial$|^Sem data final$/)).toHaveCount(0);
    const startDate = page.getByLabel('Data inicial', { exact: true });
    const endDate = page.getByLabel('Data final', { exact: true });
    await startDate.fill('');
    await endDate.fill('');
    await expect(page.getByText(/^Informe a data (inicial|final)\.$/)).toHaveCount(0);
    await expect(startDate).toHaveAttribute('aria-invalid', 'false');
    const beforeMissingDates = requests.length;
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect(page.getByText('Informe a data inicial.', { exact: true })).toBeVisible();
    await expect(page.getByText('Informe a data final.', { exact: true })).toBeVisible();
    await expect(startDate).toBeInViewport();
    await expect(page.getByText('Informe a data final.', { exact: true })).toBeInViewport();
    for (const field of [startDate, endDate]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field.locator('..')).toHaveCSS('border-color', 'rgb(255, 98, 0)');
      await expect(field.locator('..')).toHaveCSS('border-top-width', '2px');
    }
    expect(requests).toHaveLength(beforeMissingDates);
    await page.screenshot({
      path: `test-results/history-required-dates-${kind}.png`,
      fullPage: true,
    });
    await startDate.fill('2026-01-01');
    await expect(page.getByText('Informe a data inicial.', { exact: true })).toHaveCount(0);
    await expect(startDate).toHaveAttribute('aria-invalid', 'false');
    await expect(page.getByText('Informe a data final.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    expect(requests).toHaveLength(beforeMissingDates);
    await endDate.fill('2026-09-30');
    await startDate.fill('');
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect(page.getByText('Informe a data inicial.', { exact: true })).toBeVisible();
    await expect(page.getByText('Informe a data final.', { exact: true })).toHaveCount(0);
    expect(requests).toHaveLength(beforeMissingDates);
    await page.getByLabel('Data inicial', { exact: true }).fill('2026-02-01');
    await page.getByLabel('Data final', { exact: true }).fill('2026-01-01');
    const count = requests.length;
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect(
      page.getByText('A data inicial deve ser anterior ou igual à data final.'),
    ).toBeVisible();
    expect(requests).toHaveLength(count);
    await page.getByLabel('Data inicial', { exact: true }).fill('2026-01-01');
    await page.getByLabel('Data final', { exact: true }).fill('2026-09-30');
    await expect(page.getByText(/^Informe a data (inicial|final)\.$/)).toHaveCount(0);
    await expect(startDate.locator('..')).toHaveCSS('border-color', 'rgb(217, 227, 233)');
    await expect(endDate.locator('..')).toHaveCSS('border-color', 'rgb(217, 227, 233)');
    await select(
      kind === 'registro' ? 'Motorista / responsável' : 'Motorista',
      'Carlos Eduardo',
      'Wallace',
    );
    await select('Placa', 'ABC1D23', 'DEF4G56');
    await select('Contrato', 'Caxias', 'Saquarema');
    await select('Lançado por', 'Eduardo Alves Germano', 'Wallace Felizardo de Queiroz');
    if (kind === 'manutencao') await select('Tipo de manutenção', 'Revisão', 'Troca de óleo');
    await page.screenshot({
      path: `test-results/history-multiple-${kind}-open.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Filtros do histórico' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(page.getByText('Contrato recente', { exact: true })).toHaveCount(0);
    expect(requests.at(-1)).toMatchObject({
      p_tipo: kind,
      p_data_de: '2026-01-01',
      p_data_ate: '2026-09-30',
      p_motorista_ids: [2, 3],
      p_veiculo_ids: [2, 3],
      p_contrato_ids: [2, 3],
      p_autor_ids: [author, author2],
      p_tipo_manutencao_ids: kind === 'registro' ? [] : [2, 3],
      p_offset: 0,
    });
    await page.getByRole('button', { name: 'Carregar mais', exact: true }).click();
    await expect(page.getByText(/Fim dos resultados/)).toBeVisible();
    expect(requests.at(-1)).toMatchObject({
      p_offset: 20,
      p_veiculo_ids: [2, 3],
      p_data_de: '2026-01-01',
      p_autor_ids: [author, author2],
    });
    await page.getByRole('button', { name: 'Ajustar filtros', exact: true }).click();
    await page.getByLabel('Data inicial', { exact: true }).fill('2025-01-01');
    await page.getByRole('button', { name: 'Aplicar filtros', exact: true }).click();
    await expect.poll(() => requests.at(-1)?.p_data_de).toBe('2025-01-01');
    expect(requests.at(-1)?.p_data_ate).toBe('2026-09-30');
    expect(requests.at(-1)?.p_offset).toBe(0);
    await page.getByRole('button', { name: 'Filtros do histórico', exact: true }).click();
    await page.getByRole('button', { name: /^Contrato:/ }).click();
    await page.getByRole('checkbox', { name: 'Caxias', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Caxias', exact: true })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Saquarema', exact: true })).toBeChecked();
    await page.getByRole('button', { name: /^Concluir seleção/ }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    expect(requests.at(-1)?.p_contrato_ids).toEqual([2, 3]);
    await page.getByRole('button', { name: 'Filtros do histórico', exact: true }).click();
    await page.getByRole('button', { name: 'Limpar filtro', exact: true }).click();
    await expect(page.getByText('Contrato recente', { exact: true })).toBeVisible();
    expect(requests.at(-1)).toMatchObject({
      p_veiculo_ids: [],
      p_motorista_ids: [],
      p_autor_ids: [],
      p_tipo_manutencao_ids: [],
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    expect(errors).toEqual([]);
  });
}
