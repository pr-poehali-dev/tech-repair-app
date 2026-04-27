import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiGetMe, apiLogout, User } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (sessionId: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const u = await apiGetMe();
    setUser(u);
  }, []);

  useEffect(() => {
    const sid = localStorage.getItem('session_id');
    if (!sid) { setLoading(false); return; }
    apiGetMe().then((u) => { setUser(u); setLoading(false); });
  }, []);

  const login = useCallback((sessionId: string, u: User) => {
    localStorage.setItem('session_id', sessionId);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
