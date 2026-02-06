import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Iniciar sesión" : "Crear cuenta"),
    [mode]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      setLoading(true);

      if (mode === "register") {
        await registerUser({ name, email, password });
        setOk("Registro correcto. Ya puedes iniciar sesión.");
        setMode("login");
        return;
      }

      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(1000px 600px at 20% 20%, rgba(31,122,140,0.14), transparent 60%), radial-gradient(800px 500px at 80% 10%, rgba(231,111,81,0.12), transparent 60%)",
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: -1 }}>
            NutriTrace
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Seguimiento nutricional simple, rápido y bonito ✨
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Tabs
              value={mode}
              onChange={(_, v) => {
                setMode(v);
                setError("");
                setOk("");
              }}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab value="login" label="Entrar" />
              <Tab value="register" label="Registrarse" />
            </Tabs>

            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              {title}
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
              {mode === "register" && (
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              )}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />

              {error && <Alert severity="error">{error}</Alert>}
              {ok && <Alert severity="success">{ok}</Alert>}

              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? "Cargando..." : title}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
