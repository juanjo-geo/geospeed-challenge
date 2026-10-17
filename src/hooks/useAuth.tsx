import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncOnLogin } from '@/lib/cloudSync';
import { importLegacyHistoryOnce, flushPendingResults } from '@/lib/gameResults';
import { redeemTransfer } from '@/lib/identity';
import type { User, Session } from '@supabase/supabase-js';

/** Tareas de servidor al tener sesión: migrar historial local y vaciar la cola offline (F1). */
function afterSession(userId: string) {
  // Si veníamos de una sesión anónima y entramos a una cuenta existente, traer su progreso primero
  redeemTransfer()
    .then(() => importLegacyHistoryOnce(userId))
    .then(() => flushPendingResults())
    .catch(() => {});
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  /** Avatar del perfil en servidor ('mascot' o emoji) */
  avatar: string;
  /** Sesión anónima de invitado (D1): tiene identidad pero no cuenta */
  isAnonymous: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: '',
  avatar: '',
  isAnonymous: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar')
      .eq('id', userId)
      .single();
    if (data) { setDisplayName(data.display_name); setAvatar(data.avatar ?? ''); }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          // Sync cloud data on login
          syncOnLogin().catch(() => {});
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') afterSession(session.user.id);
        } else {
          setDisplayName('');
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setDisplayName('');
    setAvatar('');
  };

  const isAnonymous = !!user?.is_anonymous;

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, avatar, isAnonymous, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
