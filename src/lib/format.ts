export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
export const normalizePlate = (text: string) => normalize(text).replace(/[-\s]/g, '');
export const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const digitsOnly = (text: string) =>
  text
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 12);
export const costFromDigits = (text: string) => Number(text || '0') / 100;
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const displayDate = (value: string) => value.split('-').reverse().join('/');
export function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export const parseLocalDate = (value: string) => new Date(`${value}T12:00:00`);
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseLocalDate(value);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === value;
}
export function friendlyError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : '';
  if (/network|fetch|timeout|Failed to fetch/i.test(message))
    return 'Não foi possível conectar. Confira sua internet e tente novamente. Seus campos foram mantidos.';
  if (/Invalid login credentials/i.test(message))
    return 'Usuário ou senha incorretos. Confira e tente novamente.';
  if (/Usuário ou senha|Muitas tentativas|Sessão expirada/i.test(message)) return message;
  if (/rate limit|too many/i.test(message))
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (/42501|permission denied|JWT|session/i.test(message))
    return 'Seu acesso precisa ser verificado. Entre novamente ou fale com o administrador.';
  if (
    /Selecione|Usuário sem|Este envio|Este registro|Somente administradores|Registro não encontrado|Informe um usuário|inválid|A data não pode/i.test(
      message,
    )
  )
    return message;
  return 'Não foi possível concluir agora. Tente novamente. Se continuar, fale com o administrador.';
}
