import { test, expect } from '@playwright/test';

test('olho de visibilidade e recuperacao em duas etapas sem email', async ({ page }) => {
  let saves = 0;
  await page.route('**/rest/v1/rpc/*', async (route) => {
    const name = route.request().url().split('/').pop();
    const data = route.request().postDataJSON();
    if (name === 'validar_codigo_recuperacao') {
      return route.fulfill({
        json:
          data.p_codigo === 'ABCD-1234-ABCD-1234'
            ? { token: 'a'.repeat(64) }
            : {
                error:
                  'Usuário ou código inválido, expirado ou já utilizado. Peça um novo código ao administrador.',
              },
      });
    }
    if (name === 'recuperar_senha') {
      saves++;
      expect(data.p_senha).toBe('MinhaNovaSenha!123');
      return route.fulfill({ json: { success: true } });
    }
    return route.fulfill({
      status: 403,
      json: { code: '28000', message: 'Sessão expirada. Entre novamente.' },
    });
  });
  await page.goto('/login');
  const password = page.getByRole('textbox', { name: 'Senha', exact: true });
  await password.fill('MinhaSenhaAnterior!123');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(password).toHaveJSProperty('type', 'text');
  await expect(password).toHaveValue('MinhaSenhaAnterior!123');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('textbox', { name: 'Usuário', exact: true }).fill('user_teste');
  await page.getByRole('button', { name: 'Esqueceu sua senha?', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Usuário', exact: true })).toHaveValue(
    'user_teste',
  );
  await expect(page.getByRole('textbox', { name: 'Nova senha', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Validar código', exact: true }).click();
  await expect(page.getByText('Preencha seu usuário e o código de recuperação.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Código de recuperação', exact: true }).fill('errado');
  await page.getByRole('button', { name: 'Validar código', exact: true }).click();
  await expect(page.getByText(/Usuário ou código inválido/)).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Código de recuperação', exact: true })
    .fill('ABCD-1234-ABCD-1234');
  await page.getByRole('button', { name: 'Validar código', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('MinhaNovaSenha!123');
  await page.getByRole('textbox', { name: 'Confirmar senha', exact: true }).fill('NaoCoincide!123');
  await page.getByRole('button', { name: 'Mostrar nova senha', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nova senha', exact: true })).toHaveJSProperty(
    'type',
    'text',
  );
  await expect(page.getByRole('textbox', { name: 'Confirmar senha', exact: true })).toHaveAttribute(
    'type',
    'password',
  );
  await page.getByRole('button', { name: 'Salvar nova senha', exact: true }).click();
  await expect(page.getByText('As senhas não coincidem. Confira a confirmação.')).toBeVisible();
  expect(saves).toBe(0);
  await page
    .getByRole('textbox', { name: 'Confirmar senha', exact: true })
    .fill('MinhaNovaSenha!123');
  await page.getByRole('button', { name: 'Salvar nova senha', exact: true }).click();
  await expect(page.getByText('Senha alterada', { exact: true })).toBeVisible();
  expect(saves).toBe(1);
  await page.getByRole('button', { name: 'Voltar ao login', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Senha', exact: true })).toHaveValue('');
});
