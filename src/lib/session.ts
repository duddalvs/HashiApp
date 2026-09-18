import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';
import { normalizeLogin } from './login';
import type { Profile } from '@/types/models';

export type UserSession = { token: string; expiresAt: string; user: { id: string } };
const storageKey = 'hashi.username-session.v1';
let current: UserSession | null = null;
const expiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}
export async function clearSession() {
  current = null;
  await AsyncStorage.removeItem(storageKey);
}
export async function sessionRpc(name: string, args: Record<string, unknown> = {}) {
  if (!current) throw new Error('Sessão expirada. Entre novamente.');
  const token = current.token;
  const result = await getSupabase().rpc(name, { ...args, p_token: token });
  if (result.error?.code === '28000' && current?.token === token) {
    await clearSession();
    expiredListeners.forEach((listener) => listener());
  }
  return result;
}
export async function restoreSession(): Promise<{ session: UserSession; profile: Profile } | null> {
  const project = process.env.EXPO_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9-]+)\./)?.[1];
  if (project) await AsyncStorage.removeItem(`sb-${project}-auth-token`);
  const stored = await AsyncStorage.getItem(storageKey);
  if (!stored) return null;
  let session: UserSession;
  try {
    session = JSON.parse(stored);
  } catch {
    await clearSession();
    return null;
  }
  if (
    !/^[a-f0-9]{64}$/.test(session?.token || '') ||
    !session.user?.id ||
    !Number.isFinite(Date.parse(session.expiresAt)) ||
    Date.parse(session.expiresAt) <= Date.now()
  ) {
    await clearSession();
    return null;
  }
  current = session;
  const { data, error } = await sessionRpc('meu_perfil');
  if (error) throw error;
  return { session, profile: data as Profile };
}
export async function signIn(username: string, password: string) {
  const { data, error } = await getSupabase().rpc('autenticar_usuario', {
    p_usuario: normalizeLogin(username),
    p_senha: password,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.token || !data?.profile) throw new Error('Não foi possível validar seu acesso.');
  const session: UserSession = { token: data.token, expiresAt: data.expiresAt, user: data.user };
  try {
    await AsyncStorage.setItem(storageKey, JSON.stringify(session));
  } catch (storageError) {
    await getSupabase().rpc('encerrar_sessao', { p_token: session.token });
    throw storageError;
  }
  current = session;
  return { session, profile: data.profile as Profile };
}
export async function signOut() {
  const token = current?.token;
  try {
    if (token) await getSupabase().rpc('encerrar_sessao', { p_token: token });
  } finally {
    await clearSession();
  }
}
