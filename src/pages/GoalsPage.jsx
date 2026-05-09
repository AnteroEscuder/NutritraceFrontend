import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getGoal, upsertGoal } from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export default function GoalsPage() {
  const { token } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const data = await getGoal(token);

      setForm({
        calories: String(data?.calories ?? ""),
        protein: String(data?.protein ?? ""),
        carbs: String(data?.carbs ?? ""),
        fat: String(data?.fat ?? ""),
      });
    } catch (e) {
      const msg = e?.message || "";

      if (
        msg.toLowerCase().includes("todavía") ||
        msg.includes("404")
      ) {
        return;
      }

      setError(msg || t("No se pudieron cargar los objetivos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return;

    setError("");
    setOk("");
    setSaving(true);

    try {
      const payload = {
        calories: toInt(form.calories),
        protein: toInt(form.protein),
        carbs: toInt(form.carbs),
        fat: toInt(form.fat),
      };

      await upsertGoal({ token, payload });

      setOk(t("Objetivos guardados correctamente."));
    } catch (e2) {
      setError(e2?.message || t("No se pudieron guardar los objetivos"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 950 }}>
          {t("Objetivos")}
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {t(
            "Define tus objetivos diarios para ver el progreso en el resumen."
          )}
        </Typography>
      </Box>

      {error && <Alert severity="error">{String(error)}</Alert>}

      {ok && <Alert severity="success">{ok}</Alert>}

      <Card>
        <CardContent>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "grid", gap: 2 }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
            >
              <TextField
                label={t("Calorías (kcal)")}
                type="number"
                value={form.calories}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    calories: e.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label={t("Proteína (g)")}
                type="number"
                value={form.protein}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    protein: e.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
            >
              <TextField
                label={t("Carbohidratos (g)")}
                type="number"
                value={form.carbs}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    carbs: e.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label={t("Grasa (g)")}
                type="number"
                value={form.fat}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    fat: e.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={load}
                disabled={loading || saving}
              >
                {t("Recargar")}
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
              >
                {saving ? t("Guardando…") : t("Guardar")}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}