import { test, expect } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

test('Historico mostra nome composto do criador nos dois tipos, sem expandir', async ({ page }) => {
  const profile = {
    id: 'c1000000-0000-4000-8000-000000000001',
    nome: 'Lucas',
    sobrenome: 'Melgaço',
    login: 'user_admin',
    perfil: 'admin',
    ativo: true,
  };
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
    if (rpc === 'listar_catalogos') return route.fulfill({ json: demoCatalogs });
    if (rpc === 'filtrar_historico_multiplos') {
      const body = route.request().postDataJSON();
      return route.fulfill({
        json: [
          {
            id: 'c2000000-0000-4000-8000-000000000002',
            tipo: body.p_tipo,
            data: '2026-09-29',
            contrato: 'Magé',
            placas: ['BBE9E90'],
            detalhes: [
              {
                equipe: body.p_tipo === 'registro' ? 1 : undefined,
                servico: 'Outros',
                responsavel: 'Motorista de teste',
                placa: 'BBE9E90',
                modelo: 'Caminhão',
              },
            ],
            custo: body.p_tipo === 'manutencao' ? 10 : null,
            created_at: '2026-09-29T13:00:00Z',
            autor_nome: 'Maria Eduarda Cristina',
          },
        ],
      });
    }
    return route.fulfill({ status: 400, json: { message: 'RPC inesperada' } });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(profile.login);
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaSomenteDeTeste!123');
  await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Histórico', exact: true }).click();
  for (const [kind, filter] of [
    ['registro', 'Registros'],
    ['manutencao', 'Manutenções'],
  ]) {
    await page.getByRole('button', { name: filter, exact: true }).click();
    const card = page.getByTestId(`history-${kind}-c2000000-0000-4000-8000-000000000002`);
    await expect(
      card.getByText('Lançado por: Maria Eduarda Cristina', { exact: true }),
    ).toBeVisible();
    const details = card.getByRole('button', { name: /Lançado por: Maria Eduarda Cristina/ });
    await expect(card.getByText('Ver detalhes', { exact: true })).toBeVisible();
    await expect(card.getByText(/Motorista de teste/)).toHaveCount(0);
    await expect(card.getByText('Lançado por: Lucas')).toHaveCount(0);
    const name = card.getByText('Maria Eduarda Cristina', { exact: true });
    const bounds = await name.boundingBox();
    const cardBounds = await card.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(cardBounds!.x);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(cardBounds!.x + cardBounds!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await card.screenshot({ path: `test-results/history-author-${kind}.png` });
    await details.click();
    await expect(card.getByText(/Motorista de teste/)).toBeVisible();
    await expect(
      card.getByText('Lançado por: Maria Eduarda Cristina', { exact: true }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
