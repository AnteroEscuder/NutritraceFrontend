import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import FlagIcon from "@mui/icons-material/Flag";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SaveIcon from "@mui/icons-material/Save";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { getGoal, upsertGoal } from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("es-ES").format(n);
}

export default function GoalsPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const theme = useTheme();

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

      if (msg.toLowerCase().includes("todavía") || msg.includes("404")) {
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

  const goals = useMemo(
    () => ({
      calories: toInt(form.calories),
      protein: toInt(form.protein),
      carbs: toInt(form.carbs),
      fat: toInt(form.fat),
    }),
    [form]
  );

  const macroCalories = useMemo(
    () => ({
      protein: goals.protein * 4,
      carbs: goals.carbs * 4,
      fat: goals.fat * 9,
    }),
    [goals]
  );

  const macroTotal = macroCalories.protein + macroCalories.carbs + macroCalories.fat;
  const targetCalories = goals.calories || macroTotal || 1;
  const configuredCount = Object.values(goals).filter((value) => value > 0).length;
  const macroBalancePercent = goals.calories ? Math.round((macroTotal / goals.calories) * 100) : 0;

  const macroRows = [
    {
      key: "protein",
      label: t("Proteína"),
      value: goals.protein,
      calories: macroCalories.protein,
      color: theme.palette.primary.main,
    },
    {
      key: "carbs",
      label: t("Carbohidratos"),
      value: goals.carbs,
      calories: macroCalories.carbs,
      color: theme.palette.secondary.main,
    },
    {
      key: "fat",
      label: t("Grasa"),
      value: goals.fat,
      calories: macroCalories.fat,
      color: theme.palette.warning.main,
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) return;

    setError("");
    setOk("");
    setSaving(true);

    try {
      await upsertGoal({ token, payload: goals });

      setOk(t("Objetivos guardados correctamente."));
    } catch (e2) {
      setError(e2?.message || t("No se pudieron guardar los objetivos"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Card
        sx={{
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.07)}`,
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.25, md: 3 },
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.26)}, ${alpha(theme.palette.background.paper, 0.9)})`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)}, ${alpha(theme.palette.warning.light, 0.1)})`,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Chip
                icon={<FlagIcon />}
                label={t("Plan nutricional")}
                color="primary"
                sx={{ fontWeight: 850, mb: 2 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.08 }}>
                {t("Objetivos")}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 650 }}>
                {t("Define tus objetivos diarios para ver el progreso en el resumen.")}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={load}
                disabled={loading || saving}
                sx={{ height: 42, fontWeight: 900 }}
              >
                {t("Recargar")}
              </Button>
              <Button
                type="submit"
                form="goals-form"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ height: 42, fontWeight: 900 }}
              >
                {saving ? t("Guardando…") : t("Guardar")}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{String(error)}</Alert>}
      {ok && <Alert severity="success">{ok}</Alert>}

      {loading && <LinearProgress sx={{ height: 6, borderRadius: 999 }} />}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <GoalMetric icon={<LocalFireDepartmentIcon />} label={t("Calorías diarias")} value={`${formatNumber(goals.calories)} kcal`} color="error" />
        <GoalMetric icon={<FitnessCenterIcon />} label={t("Proteína diaria")} value={`${formatNumber(goals.protein)} g`} color="primary" />
        <GoalMetric icon={<RestaurantIcon />} label={t("Macros configurados")} value={`${configuredCount}/4`} color="secondary" />
        <GoalMetric icon={<SpeedIcon />} label={t("Balance estimado")} value={`${macroBalancePercent}%`} color="success" />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                <FlagIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Configuración diaria")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Ajusta tus calorías y macronutrientes objetivo.")}
                </Typography>
              </Box>
            </Stack>

            <Box id="goals-form" component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
              <TextField
                label={t("Calorías (kcal)")}
                type="number"
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                fullWidth
                inputProps={{ min: "0", step: "1" }}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                <TextField
                  label={t("Proteína (g)")}
                  type="number"
                  value={form.protein}
                  onChange={(e) => setForm((p) => ({ ...p, protein: e.target.value }))}
                  fullWidth
                  inputProps={{ min: "0", step: "1" }}
                />

                <TextField
                  label={t("Carbohidratos (g)")}
                  type="number"
                  value={form.carbs}
                  onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
                  fullWidth
                  inputProps={{ min: "0", step: "1" }}
                />

                <TextField
                  label={t("Grasa (g)")}
                  type="number"
                  value={form.fat}
                  onChange={(e) => setForm((p) => ({ ...p, fat: e.target.value }))}
                  fullWidth
                  inputProps={{ min: "0", step: "1" }}
                />
              </Box>

              <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "flex-end", gap: 1 }}>
                <Button type="button" variant="outlined" onClick={load} disabled={loading || saving}>
                  {t("Recargar")}
                </Button>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? t("Guardando…") : t("Guardar")}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.main" }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Vista previa del reparto")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Equivalencia energética de tus macros.")}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2.25}>
              {macroRows.map((row) => {
                const percent = Math.max(0, Math.min(100, Math.round((row.calories / targetCalories) * 100)));
                return (
                  <Box key={row.key}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 850 }}>{row.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(row.value)} g · {formatNumber(row.calories)} kcal
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        bgcolor: alpha(row.color, 0.14),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          bgcolor: row.color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Calorías por macros")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Compara el total de macros con tu objetivo calórico.")}
                </Typography>
              </Box>
              <Chip
                color={goals.calories && macroTotal > goals.calories ? "warning" : "success"}
                label={`${formatNumber(macroTotal)} kcal`}
                sx={{ fontWeight: 900 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function GoalMetric({ icon, label, value, color = "primary" }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette[color].main, 0.12), color: `${color}.main` }}>
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 950 }} noWrap>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
