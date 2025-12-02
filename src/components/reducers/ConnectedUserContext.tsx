import { supabase } from '@/utils/config';
import { getErrorMessage } from '@/utils/utils';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

type ConnectedUserContextValue = {
  user: User | null;
  session: Session | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ConnectedUserContext = createContext<ConnectedUserContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const ConnectedUserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [userSession, setUserSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  >('loading');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      setStatus('loading');

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(getErrorMessage(sessionError));
        setStatus('error');
        return;
      }

      setUserSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setStatus(data.session ? 'authenticated' : 'unauthenticated');
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setStatus('loading');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(getErrorMessage(authError));
      setStatus('error');
      return;
    }
  };

  const logout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(getErrorMessage(signOutError));
      setStatus('error');
      return;
    }
  };

  return (
    <ConnectedUserContext.Provider
      value={{ user, session: userSession, status, error, login, logout }}
    >
      {children}
    </ConnectedUserContext.Provider>
  );
};

export const useConnectedUserContext = () => {
  const ctx = useContext(ConnectedUserContext);
  if (!ctx) {
    throw new Error('useConnectedUserContext must be used inside <ConnectedUserProvider>');
  }
  return ctx;
};
