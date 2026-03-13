import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { authApi } from "../api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    console.log("fetchMe called");
    const token = localStorage.getItem("access_token");
    console.log("token:", token);
    if (!token) { 
      console.log("no token, setting loading false");
      setLoading(false); 
      return; 
    }
    try {
      const { data } = await authApi.me();
      console.log("user data:", data);
      setUser(data);
    } catch (e) {
      console.log("error:", e);
      authApi.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    await authApi.login(email, password);
    await fetchMe();
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const register = async (email: string, username: string, password: string) => {
    await authApi.register(email, username, password);
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
