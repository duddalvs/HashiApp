import { test, expect } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

test('API: observacao limitada, historico, edicao e motorista null', async ({ page }) => {
  const profile = {
    id: 'c1000000-0000-4000-8000-000000000001',
    nome: 'Teste',
    sobrenome: 'Manutenção',
    login: 'user_teste',
    perfil: 'funcionario',
    ativo: true,
  };
  const writes: Record<string, any>[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let saved: Record<string, any> | undefined;
  await page.route('**/rest/v1/**', async (route) => {
    const name = route.request().url().split('/').pop();
    const body = route.request().postDataJSON();
    if (name === 'autenticar_usuario')
      return route.fulfill({
        json: {
          token: 'a'.repeat(64),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          user: { id: profile.id },
          profile,
        },
      });
    if (name === 'meu_perfil') return route.fulfill({ json: profile });
    if (name === 'listar_catalogos') return route.fulfill({ json: demoCatalogs });
    if (name === 'salvar_manutencao' || name === 'editar_manutencao') {
      writes.push(body);
      saved = {
        id: body.p_id,
        date: body.p_data,
        driverId: body.p_motorista_id,
        typeId: body.p_tipo_id,
        contractId: body.p_contrato_id,
        vehicleId: body.p_veiculo_id,
        costDigits: String(Math.round(body.p_custo * 100)),
        note: body.p_observacao ?? '',
        version: (saved?.version ?? 0) + 1,
      };
      return route.fulfill({ json: body.p_id });
    }
    if (name === 'obter_envio') return route.fulfill({ json: saved });
    if (name === 'filtrar_historico_multiplos')
      return route.fulfill({
        json: saved
          ? [
              {
                id: saved.id,
                tipo: 'manutencao',
                data: saved.date,
                contrato: 'Magé',
                placas: ['BBE9E90'],
                detalhes: [
                  {
                    servico: 'Outros',
                    responsavel: saved.driverId === null ? null : 'João — exemplo',
                    placa: 'BBE9E90',
                    modelo: 'M.BENZ/ACCELO 815 CE',
                    observacao: saved.note || null,
                  },
                ],
                custo: 10,
                created_at: new Date().toISOString(),
                autor_nome: profile.nome,
              },
            ]
          : [],
      });
    return route.fulfill({ status: 400, json: { message: 'RPC inesperada no teste.' } });
  });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(profile.login);
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaSomenteDeTeste!123');
  await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
  await page.getByRole('tab', { name: 'Manutenção', exact: true }).click();
  for (const [label, option] of [
    ['Placa', 'BBE9E90'],
    ['Tipo de manutenção', 'Outros'],
    ['Contrato', 'Magé'],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${label}:`) }).click();
    await page.getByRole('button', { name: option, exact: true }).click();
  }
  const checkbox = page.getByRole('checkbox', { name: 'Motorista não identificado', exact: true });
  await checkbox.click();
  await page.setViewportSize({ width: 320, height: 740 });
  const note = page.getByRole('textbox', { name: 'Observação', exact: true });
  await note.fill('á'.repeat(41));
  await expect(note).toHaveValue('á'.repeat(40));
  await expect(page.getByText('40/40', { exact: true })).toBeVisible();
  await note.fill('🚚'.repeat(40));
  await expect(note).toHaveValue('🚚'.repeat(40));
  await expect(page.getByText('40/40', { exact: true })).toBeVisible();
  await note.fill('Troca de óleo');
  const fieldOrder = await Promise.all(
    [
      page.getByRole('button', { name: /^Tipo de manutenção:/ }),
      note,
      page.getByRole('textbox', { name: 'Valor', exact: true }),
    ].map(async (field) => (await field.boundingBox())!.y),
  );
  expect(fieldOrder).toEqual([...fieldOrder].sort((a, b) => a - b));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: 'test-results/maintenance-note-form.png', fullPage: true });
  await page.getByRole('textbox', { name: 'Valor', exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Salvar manutenção', exact: true }).click();
  await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
  expect(writes).toHaveLength(1);
  expect(writes[0].p_motorista_id).toBeNull();
  expect(writes[0].p_tipo_id).toBe(8);
  expect(writes[0].p_observacao).toBe('Troca de óleo');
  await page.getByRole('button', { name: /Ver detalhes/ }).click();
  await expect(page.getByText('Observação: Troca de óleo', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Motorista: Motorista não identificado', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).toBeChecked();
  await expect(note).toHaveValue('Troca de óleo');
  await note.fill('Revisão concluída');
  await checkbox.click();
  await page.getByRole('button', { name: /^Motorista:/ }).click();
  await page.getByRole('button', { name: 'João — exemplo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[1].p_motorista_id).toBe(1);
  expect(writes[1].p_versao).toBe(1);
  expect(writes[1].p_observacao).toBe('Revisão concluída');
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(note).toHaveValue('Revisão concluída');
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('button', { name: /^Motorista: João/ })).toBeVisible();
  await note.fill('');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
  expect(writes[2].p_observacao).toBe('');
  await expect(page.getByText(/^Observação:/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(note).toHaveValue('');
  await expect(page.getByText('0/40', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
