"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, email: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hydrated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    email: null,
    name: null,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nexapex_auth");
    if (stored) {
      try {
        setAuth(JSON.parse(stored));
      } catch {
        /* ignore malformed data */
      }
    }
    setHydrated(true);
  }, []);

  const login = useCallback((token: string, email: string, name: string) => {
    const state = { token, email, name };
    setAuth(state);
    localStorage.setItem("nexapex_auth", JSON.stringify(state));
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, email: null, name: null });
    localStorage.removeItem("nexapex_auth");
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...auth, login, logout, isAuthenticated: !!auth.token, hydrated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
