import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import LabelIcon from "@mui/icons-material/Label";
import GrainIcon from "@mui/icons-material/Grain";
import EggAltIcon from "@mui/icons-material/EggAlt";
import SetMealIcon from "@mui/icons-material/SetMeal";
import PhishingIcon from "@mui/icons-material/Phishing";
import ScienceIcon from "@mui/icons-material/Science";
import SpaIcon from "@mui/icons-material/Spa";
import LunchDiningIcon from "@mui/icons-material/LunchDining";

import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { listAllergens, getMyAllergies, updateMyAllergies } from "../api";

function allergenIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("gluten") || n.includes("trigo") || n.includes("cereal")) return <GrainIcon />;
  if (n.includes("huevo")) return <EggAltIcon />;
  if (n.includes("leche") || n.includes("lact") || n.includes("case")) return <SetMealIcon />;
  if (n.includes("pesc")) return <PhishingIcon />;
  if (n.includes("soja") || n.includes("soya")) return <SpaIcon />;
  if (n.includes("fruto") || n.includes("nuez") || n.includes("cacahu")) return <LunchDiningIcon />;
  if (n.includes("sulf") || n.includes("aditiv") || n.includes("quím")) return <ScienceIcon />;
  return <LabelIcon />;
}

export default function ProfilePage() {
  const { token, user } = useAuth();

  const [allergens, setAllergens] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCount = selectedIds.size;

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setError("");
      setMessage("");
      try {
        setLoading(true);

        // 1) lista de alérgenos disponibles
        const a = await listAllergens();
        setAllergens(a);

        // 2) alergias actuales del usuario
        const my = await getMyAllergies(token);
        setSelectedIds(new Set(my.map((x) => x.id)));
      } catch (err) {
        console.error(err);
        setError(err.message || "Error cargando perfil");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const toggleAllergen = (id) => {
    setMessage("");
    setError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectNone = () => {
    setMessage("");
    setError("");
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setMessage("");
    setError("");
    setSelectedIds(new Set(allergens.map((a) => a.id)));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!token) return;

    setError("");
    setMessage("");

    try {
      setSaving(true);
      const updated = await updateMyAllergies(selectedArray, token);
      setSelectedIds(new Set(updated.map((x) => x.id)));
      setMessage("Perfil actualizado. Guardado correctamente.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5">Cuenta</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Gestiona tu perfil y selecciona tus alergias para que NutriTrace pueda avisarte.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Sesión iniciada como <b>{user?.name || "Usuario"}</b>
              {user?.email ? ` · ${user.email}` : ""}
            </Typography>
          </Box>

          <Card>
            {loading && <LinearProgress />}
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.25 }}>
                    Alergias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}.
                    Toca un alérgeno para marcarlo o desmarcarlo.
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={selectAll}
                    disabled={!allergens.length || saving || loading}
                  >
                    Seleccionar todo
                  </Button>
                  <Button variant="text" onClick={selectNone} disabled={saving || loading}>
                    Quitar todo
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </Stack>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    minHeight: 44,
                  }}
                >
                  {allergens.map((a) => {
                    const selected = selectedIds.has(a.id);
                    return (
                      <Chip
                        key={a.id}
                        icon={allergenIcon(a.name)}
                        label={a.name}
                        clickable
                        onClick={() => toggleAllergen(a.id)}
                        disabled={saving || loading}
                        color={selected ? "secondary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        sx={{
                          borderRadius: 999,
                          px: 0.5,
                          "& .MuiChip-icon": { opacity: selected ? 1 : 0.7 },
                        }}
                      />
                    );
                  })}

                  {!loading && !allergens.length && (
                    <Typography variant="body2" color="text.secondary">
                      No hay alérgenos cargados en el sistema.
                    </Typography>
                  )}
                </Box>

                {error && <Alert severity="error">{error}</Alert>}
                {message && <Alert severity="success">{message}</Alert>}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6">Cómo se usa</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Esto ayuda a que la app pueda avisarte y filtrar alimentos incompatibles.
              </Typography>

              <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5, lineHeight: 1.8 }}>
                <li>Marca aquí tus alérgenos (por ejemplo: Gluten, Lactosa…).</li>
                <li>Al registrar comidas, la app podrá avisarte si un alimento los contiene.</li>
                <li>Puedes editarlo cuando quieras: se guarda en tu perfil.</li>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </AppLayout>
  );
}
