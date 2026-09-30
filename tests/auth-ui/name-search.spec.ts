import { test, expect } from '@playwright/test';
import { demoCatalogs } from '../../src/data/demo';

for (const kind of ['registro', 'manutencao'] as const) {
  test(`busca de funcionarios em ordem e destaque no novo envio e edicao: ${kind}`, async ({
    page,
  }, testInfo) => {
    const fullName = 'Carlos Eduardo Alves Germano';
    const profile = {
      id: 'c1000000-0000-4000-8000-000000000001',
      nome: 'Teste',
      sobrenome: 'Pesquisa',
      login: 'user_teste',
      perfil: 'funcionario',
      ativo: true,
    };
    const catalogs = {
      ...demoCatalogs,
      employees: [
        fullName,
        'Alves Carlos Moura',
        'José João Gonçalves',
        ...Array.from({ length: 1500 }, (_, i) => `Pessoa de Teste ${i}`),
      ].map((nome, index) => ({
        id: 101 + index,
        nome,
        ativo: true,
        is_status: false,
      })),
    };
    const writes: Record<string, any>[] = [];
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
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
      if (rpc === 'listar_catalogos') return route.fulfill({ json: catalogs });
      if (rpc === 'ultimo_veiculo_motorista') return route.fulfill({ json: null });
      if (rpc === `salvar_${kind}` || rpc === `editar_${kind}`) {
        const body = route.request().postDataJSON();
        writes.push(body);
        return route.fulfill({ json: body.p_id });
      }
      const saved = writes.at(-1);
      if (rpc === 'filtrar_historico_multiplos')
        return route.fulfill({
          json: saved
            ? [
                {
                  id: saved.p_id,
                  tipo: kind,
                  data: saved.p_data,
                  contrato: 'Magé',
                  placas: ['SP-6539'],
                  detalhes:
                    kind === 'registro'
                      ? [
                          {
                            equipe: 1,
                            responsavel: fullName,
                            placa: 'SP-6539',
                            modelo: 'RETROESCAVADEIRA',
                          },
                        ]
                      : [
                          {
                            servico: 'Outros',
                            responsavel: fullName,
                            placa: 'SP-6539',
                            modelo: 'RETROESCAVADEIRA',
                          },
                        ],
                  custo: kind === 'registro' ? null : 10,
                  created_at: new Date().toISOString(),
                  autor_nome: profile.nome,
                },
              ]
            : [],
        });
      if (rpc === 'obter_envio' && saved)
        return route.fulfill({
          json: {
            id: saved.p_id,
            date: saved.p_data,
            contractId: saved.p_contrato_id,
            version: 1,
            ...(kind === 'registro'
              ? { teams: saved.p_equipes }
              : {
                  vehicleId: saved.p_veiculo_id,
                  driverId: saved.p_motorista_id,
                  typeId: saved.p_tipo_id,
                  costDigits: '1000',
                }),
          },
        });
      return route.fulfill({ status: 400, json: { message: 'RPC inesperada no teste.' } });
    });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(profile.login);
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaSomenteDeTeste!123');
    await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
    await page.setViewportSize({ width: 320, height: 740 });
    await page
      .getByRole('tab', { name: kind === 'registro' ? 'Registro' : 'Manutenção', exact: true })
      .click();
    const label = kind === 'registro' ? 'Equipe 1 — Responsável' : 'Motorista';
    const trigger = page.getByRole('button', { name: new RegExp(`^${label}:`) });
    const input = page.getByRole('textbox', { name: `Pesquisar ${label}`, exact: true });
    const option = page.getByRole('button', { name: fullName, exact: true });
    await trigger.click();
    // Filtering must reach the full catalog, even though only visible rows render.
    await input.pressSequentially('Pessoa 1499', { delay: 10 });
    await expect(
      page.getByRole('button', { name: 'Pessoa de Teste 1499', exact: true }),
    ).toBeVisible();
    await expect(input).toHaveValue('Pessoa 1499');
    for (const [query, highlights] of [
      ['Carlos', ['Carlos']],
      ['Eduardo', ['Eduardo']],
      ['Eduardo Alves', ['Eduardo', 'Alves']],
      ['Alves', ['Alves']],
      ['Germano', ['Germano']],
      ['Carlos Alves', ['Carlos', 'Alves']],
      ['  carlos   ALVES  ', ['Carlos', 'Alves']],
      ['edu ger', ['Edu', 'Ger']],
    ] as const) {
      await input.fill(query);
      await expect(option).toBeVisible();
      await expect(option.getByTestId('name-search-match')).toHaveText([...highlights]);
    }
    await input.fill('Carlos Alves');
    await expect(option.getByTestId('name-search-match').first()).toHaveCSS('font-weight', '800');
    await expect(option.getByTestId('name-search-match').first()).toHaveCSS(
      'background-color',
      'rgb(255, 240, 231)',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.screenshot({
      path: testInfo.outputPath('pesquisa-funcionarios.png'),
      fullPage: true,
    });
    await input.fill('Alves Carlos');
    await expect(option).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Alves Carlos Moura', exact: true }),
    ).toBeVisible();
    await input.fill('Carlos Souza');
    await expect(page.getByText('Nenhuma opção encontrada. Tente outro nome.')).toBeVisible();
    await input.fill('jose goncalves');
    await expect(
      page
        .getByRole('button', { name: 'José João Gonçalves', exact: true })
        .getByTestId('name-search-match'),
    ).toHaveText(['José', 'Gonçalves']);
    await page.getByRole('button', { name: 'Fechar opções', exact: true }).click();
    await expect(trigger).toHaveAccessibleName(`${label}: Toque para selecionar`);
    await trigger.click();
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('name-search-match')).toHaveCount(0);
    await input.fill('Eduardo Alves');
    await option.click();
    await expect(trigger).toHaveAccessibleName(`${label}: ${fullName}`);
    await trigger.click();
    await page.getByRole('button', { name: 'Limpar seleção', exact: true }).click();
    await expect(trigger).toHaveAccessibleName(`${label}: Toque para selecionar`);
    await trigger.click();
    await input.fill('Germano');
    await option.click();

    for (const [field, query, result] of [
      ['Contrato', 'mage', 'Magé'],
      [kind === 'registro' ? 'Equipe 1 — Placa do veículo' : 'Placa', 'sp6539', 'SP-6539'],
      ...(kind === 'manutencao' ? [['Tipo de manutenção', 'outros', 'Outros']] : []),
    ]) {
      await page.getByRole('button', { name: new RegExp(`^${field}:`) }).click();
      await page.getByRole('textbox', { name: `Pesquisar ${field}`, exact: true }).fill(query);
      await page.getByRole('button', { name: result, exact: true }).click();
    }
    if (kind === 'manutencao')
      await page.getByRole('textbox', { name: 'Valor', exact: true }).fill('1000');
    await page
      .getByRole('button', {
        name: kind === 'registro' ? 'Salvar registro' : 'Salvar manutenção',
        exact: true,
      })
      .click();
    await page.getByRole('button', { name: 'Ver histórico', exact: true }).click();
    expect(writes).toHaveLength(1);
    expect(
      kind === 'registro' ? writes[0].p_equipes[0].responsavel_id : writes[0].p_motorista_id,
    ).toBe(101);
    await page.getByRole('button', { name: 'Editar registro', exact: true }).click();
    await expect(trigger).toHaveAccessibleName(`${label}: ${fullName}`);
    await trigger.click();
    await input.fill('Carlos Alves');
    await expect(option.getByTestId('name-search-match')).toHaveText(['Carlos', 'Alves']);
    await option.click();
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
    await expect(page.getByText('Alterações salvas.', { exact: true })).toBeVisible();
    expect(writes).toHaveLength(2);
    expect(writes[1].p_versao).toBe(1);
    expect(
      kind === 'registro' ? writes[1].p_equipes[0].responsavel_id : writes[1].p_motorista_id,
    ).toBe(101);
    expect(errors).toEqual([]);
  });
}
