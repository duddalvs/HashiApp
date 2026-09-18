import { test, expect } from '@playwright/test';

for (const person of [
  { nome: 'Lucas', sobrenome: 'Melgaço', login: 'user_admin', perfil: 'admin', saudacao: 'Lucas' },
  {
    nome: 'Maria Eduarda',
    sobrenome: 'Alves',
    login: 'user_pessoa1',
    perfil: 'funcionario',
    saudacao: 'Maria',
  },
]) {
  test(`saudação por nome e menu com sobrenome: ${person.nome}`, async ({ page }) => {
    const profile = { ...person, id: 'c1000000-0000-4000-8000-000000000001', ativo: true };
    await page.route('**/rest/v1/**', async (route) => {
      const name = route.request().url().split('/').pop();
      if (name === 'autenticar_usuario') {
        expect(route.request().postDataJSON().p_usuario).toBe(person.login);
        return route.fulfill({
          json: {
            token: 'a'.repeat(64),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: { id: profile.id },
            profile,
          },
        });
      }
      if (name === 'meu_perfil') return route.fulfill({ json: profile });
      if (name === 'listar_catalogos')
        return route.fulfill({
          json: {
            employees: [],
            vehicles: [],
            contracts: [],
            maintenanceTypes: [],
          },
        });
      return route.fulfill({ status: 400, json: { message: 'RPC fora do cenário de teste.' } });
    });
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill(person.login);
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
    await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('SenhaSomenteDeTeste!123');
    await page.getByRole('button', { name: 'Acessar minha conta', exact: true }).click();
    await expect(page.getByRole('heading', { name: `Olá, ${person.saudacao}!` })).toBeVisible();
    await expect(page.getByText(`Olá, ${person.login}!`, { exact: false })).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 740 });
    await expect(page.getByRole('heading', { name: `Olá, ${person.saudacao}!` })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(
      page.getByText(`${person.nome} ${person.sobrenome}`, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(person.perfil === 'admin' ? 'Administrador' : 'Usuário comum', {
        exact: true,
      }),
    ).toBeVisible();
  });
}
