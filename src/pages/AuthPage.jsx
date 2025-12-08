import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangeAuth = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);

      if (authMode === "register") {
        await registerUser(authForm.name, authForm.email, authForm.password);
        setMessage("Registro correcto. Iniciando sesión...");
        setAuthMode("login");
      }

      await login(authForm.email, authForm.password);
      navigate("/foods"); // después de login, a la vista principal
    } catch (err) {
      console.error(err);
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>NutriTrace</h1>
      <div className="card">
        <div className="tabs">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            className={authMode === "register" ? "active" : ""}
            onClick={() => setAuthMode("register")}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmitAuth} className="form">
          {authMode === "register" && (
            <div className="field">
              <label>Nombre</label>
              <input
                type="text"
                value={authForm.name}
                onChange={(e) => handleChangeAuth("name", e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => handleChangeAuth("email", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={authForm.password}
              onChange={(e) =>
                handleChangeAuth("password", e.target.value)
              }
              required
            />
          </div>

          {error && <p className="error">{error}</p>}
          {message && <p className="ok">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Cargando..."
              : authMode === "login"
              ? "Entrar"
              : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
