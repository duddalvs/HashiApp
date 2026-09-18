export function normalizeLogin(value: string): string {
  const login = value.trim().toLowerCase();
  if (/^[a-z][a-z0-9_]{2,39}$/.test(login)) return login;
  throw new Error('Informe um usuário válido, como user_pessoa1.');
}
