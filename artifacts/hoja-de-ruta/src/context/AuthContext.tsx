import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setBaseUrl, setAuthTokenGetter } from "../../../../lib/api-client-react/src";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface AuthState {
  token: string | null;
  nombre: string | null;
}

interface AuthContextType extends AuthState {
  login: (nombre: string, contrasena: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem("token"),
    nombre: localStorage.getItem("usuario"),
  }));

  // Inicializar síncronamente para que las queries tengan el token desde el inicio
  setBaseUrl(API_URL || null);
  setAuthTokenGetter(() => auth.token);

  const login = async (nombre: string, contrasena: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, contrasena }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al iniciar sesión");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", data.nombre);
    setAuth({ token: data.token, nombre: data.nombre });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAuth({ token: null, nombre: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
