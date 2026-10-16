import { createContext, useContext, useState } from 'react';
import api, { STORAGE_KEY } from '../api/axios';

const AuthContext = createContext(null);

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

const saveUser = (user) => {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore: the user just won't stay logged in after a refresh */
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const authenticate = async (path, payload) => {
    const { data } = await api.post(path, payload);
    saveUser(data);
    setUser(data);
    return data;
  };

  const login = (email, password) => authenticate('/auth/login', { email, password });
  const register = (name, email, password) =>
    authenticate('/auth/register', { name, email, password });

  const logout = () => {
    saveUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
