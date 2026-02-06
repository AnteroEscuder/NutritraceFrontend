import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  // Cargar /auth/me si ya hay token guardado
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await getMe(token);
        setUser(me);
      } catch (err) {
        console.error("Error cargando usuario actual:", err);
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const newToken = await loginUser({ email, password });
    setToken(newToken);
    localStorage.setItem("token", newToken);
    const me = await getMe(newToken);
    setUser(me);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
