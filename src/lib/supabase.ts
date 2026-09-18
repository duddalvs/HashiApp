import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
// Apenas chaves publicáveis. Nunca aceitar secret/service_role neste cliente.
export const isConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.startsWith('sb_publishable_');
export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;
export function getSupabase() {
  if (!supabase) throw new Error('Supabase ainda não configurado.');
  return supabase;
}
