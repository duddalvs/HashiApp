import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import type { Profile } from '@/types/models';
import { isConfigured } from '@/lib/supabase';
import { getProfile } from '@/lib/api';
import { friendlyError } from '@/lib/format';
import * as sessions from '@/lib/session';
type AuthContextValue = {
  session: sessions.UserSession | null;
  profile: Profile | null;
  loading: boolean;
  error: string;
  demo: boolean;
  enterDemo: () => void;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<sessions.UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let mounted = true;
    const remove = sessions.onSessionExpired(() => {
      if (mounted) {
        setSession(null);
        setProfile(null);
        setError('Sessão expirada. Entre novamente.');
      }
    });
    if (isConfigured) {
      sessions
        .restoreSession()
        .then((value) => {
          if (mounted && value) {
            setSession(value.session);
            setProfile(value.profile);
          }
        })
        .catch((err) => {
          if (mounted) setError(friendlyError(err));
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else setLoading(false);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') setRevision((r) => r + 1);
    });
    return () => {
      mounted = false;
      remove();
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    let mounted = true;
    getProfile()
      .then((p) => {
        if (mounted) {
          setProfile(p);
          setError('');
        }
      })
      .catch((err) => {
        if (mounted) setError(friendlyError(err));
      });
    return () => {
      mounted = false;
    };
  }, [session?.token, revision]);
  async function signIn(username: string, password: string) {
    const value = await sessions.signIn(username, password);
    setSession(value.session);
    setProfile(value.profile);
    setDemo(false);
    setError('');
  }
  async function signOut() {
    try {
      await sessions.signOut();
    } finally {
      setSession(null);
      setProfile(null);
      setDemo(false);
      setError('');
    }
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        error,
        demo,
        signIn,
        signOut,
        reloadProfile: () => setRevision((r) => r + 1),
        enterDemo: () => {
          if (__DEV__ && !isConfigured) {
            setDemo(true);
            setLoading(false);
            setError('');
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente');
  return context;
}
