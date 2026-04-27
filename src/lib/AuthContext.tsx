import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiGetMe, apiLogout, User } from './api';

const USER_KEY = 'crm_user';
const SESSION_KEY = 'session_id';

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

function loadCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(u: User | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = localStorage.getItem(SESSION_KEY);
    const cached = loadCachedUser();

    // Есть кэш — сразу показываем приложение, обновляем в фоне
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    if (!sid) {
      setLoading(false);
      return;
    }

    // Фоновое обновление данных (если есть интернет)
    apiGetMe()
      .then((u) => {
        if (u) {
          setUser(u);
          saveUser(u);
        } else if (!cached) {
          // Сессия протухла и кэша нет — выходим
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
        }
      })
      .catch(() => {
        // Нет интернета — работаем с кэшем
        if (!cached) setUser(null);
      })
      .finally(() => {
        if (!cached) setLoading(false);
      });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiGetMe();
      if (u) { setUser(u); saveUser(u); }
    } catch {
      // offline — используем кэш
    }
  }, []);

  const login = useCallback((sessionId: string, u: User) => {
    localStorage.setItem(SESSION_KEY, sessionId);
    saveUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* offline */ }
    localStorage.removeItem(SESSION_KEY);
    saveUser(null);
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
