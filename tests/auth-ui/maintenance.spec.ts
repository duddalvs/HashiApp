import { test, expect } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

test('API: grava motorista null e reabre a edicao com a opcao marcada', async ({ page }) => {
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
        version: (saved?.version ?? 0) + 1,
      };
      return route.fulfill({ json: body.p_id });
    }
    if (name === 'obter_envio') return route.fulfill({ json: saved });
    if (name === 'buscar_historico')
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
                  },
                ],
                custo: 10,
                created_at: new Date().toISOString(),
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
  await page.getByRole('textbox', { name: 'Valor', exact: true }).fill('1000');
  await page.getByRole('button', { name: 'Salvar manutenção', exact: true }).click();
  await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
  expect(writes).toHaveLength(1);
  expect(writes[0].p_motorista_id).toBeNull();
  expect(writes[0].p_tipo_id).toBe(8);
  await page.getByRole('button', { name: /Ver detalhes/ }).click();
  await expect(
    page.getByText('Motorista: Motorista não identificado', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).toBeChecked();
  await checkbox.click();
  await page.getByRole('button', { name: /^Motorista:/ }).click();
  await page.getByRole('button', { name: 'João — exemplo', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
  expect(writes).toHaveLength(2);
  expect(writes[1].p_motorista_id).toBe(1);
  expect(writes[1].p_versao).toBe(1);
  await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByRole('button', { name: /^Motorista: João/ })).toBeVisible();
  expect(errors).toEqual([]);
});
