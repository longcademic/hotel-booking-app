import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

type User = { id: string; name: string; email: string; role: 'customer' | 'admin' };
type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) setUser((await api.get('/auth/me')).data.user);
      } catch {
        await SecureStore.deleteItemAsync('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handle = async (path: string, body: object) => {
    const { data } = await api.post(path, body);
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
  };

  const value: Ctx = {
    user,
    loading,
    login: (email, password) => handle('/auth/login', { email, password }),
    register: (name, email, password) => handle('/auth/register', { name, email, password }),
    logout: async () => {
      await SecureStore.deleteItemAsync('token');
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}