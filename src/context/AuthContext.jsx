import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  const clearSession = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const me = await getMe(token);
        setUser(me);
      } catch (err) {
        console.error("Error cargando usuario actual:", err);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const newToken = await loginUser({ email, password });
      localStorage.setItem("token", newToken);
      setToken(newToken);

      const me = await getMe(newToken);
      setUser(me);

      return me;
    } catch (err) {
      console.error("Error en login:", err);
      clearSession();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setLoading(false);
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