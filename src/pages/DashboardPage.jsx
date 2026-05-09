import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import StatCard from "../components/StatCard";
import Sparkline from "../components/Sparkline";
import { getDailySummary, getGoal } from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function safeRatio(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [day, setDay] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState("");
  const [week, setWeek] = useState({ labels: [], calories: [] });

  const { t } = useI18n();

  const load = async () => {
    if (!token || !user?.id) return;
    setError("");

    try {
      const [s, g] = await Promise.all([
        getDailySummary({ userId: user.id, date: day, token }),
        getGoal(token).catch(() => null),
      ]);
      setSummary(s);
      setGoal(g);
    } catch (e) {
      setError(e?.message || t("No se pudo cargar el resumen"));
    }

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(day);
      d.setDate(d.getDate() - (6 - i));
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60 * 1000);
      return local.toISOString().slice(0, 10);
    });

    const weekSummaries = await Promise.all(
      days.map((date) =>
        getDailySummary({ userId: user.id, date, token }).catch(() => null)
      )
    );

    setWeek({
      labels: days.map((d) => d.slice(5)),
      calories: weekSummaries.map((s) => s?.total_calories ?? 0),
    });
  };

  useEffect(() => {
    load();
  }, [token, user?.id, day]);

  const progress = useMemo(() => {
    if (!goal || !summary) return null;
    return {
      calories: goal.calories ? safeRatio(summary.total_calories / goal.calories) : 0,
      protein: goal.protein ? safeRatio(summary.total_protein / goal.protein) : 0,
      carbs: goal.carbs ? safeRatio(summary.total_carbs / goal.carbs) : 0,
      fat: goal.fat ? safeRatio(summary.total_fat / goal.fat) : 0,
    };
  }, [goal, summary]);

  const lastKcal = week.calories.at(-1) ?? 0;
  const weekAvg =
    week.calories.length > 0
      ? Math.round(week.calories.reduce((a, b) => a + (Number(b) || 0), 0) / week.calories.length)
      : 0;

  const caloriePercent =
    goal?.calories && summary
      ? Math.round((summary.total_calories / goal.calories) * 100)
      : 0;

  const biggestMeals = [...(summary?.meals || [])]
    .sort((a, b) => Number(b.calories || 0) - Number(a.calories || 0))
    .slice(0, 3);

  const dailyMessage = !goal
    ? t("Configura tus objetivos para ver recomendaciones.")
    : caloriePercent < 70
      ? t("Vas bastante bien, aún tienes margen para completar tu objetivo.")
      : caloriePercent <= 100
        ? t("Estás cerca de tu objetivo diario.")
        : t("Has superado tu objetivo diario de calorías.");

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            {t("Resumen")}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t("Total del día y progreso frente a tus objetivos.")}
          </Typography>
        </Box>

        <TextField
          label={t("Día")}
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
      </Box>

      {error && <Alert severity="error">{String(error)}</Alert>}

      {!goal && (
        <Alert severity="info">
          {t("Aún no tienes objetivos configurados. Ve a “Objetivos” para establecerlos.")}
        </Alert>
      )}

      {/* ===== FILA 1: StatCards ===== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          title={t("Calorías")}
          value={`${summary?.total_calories ?? 0} kcal`}
          subtitle={goal ? `${t("Objetivo")}: ${goal.calories} kcal` : undefined}
          progress={progress ? progress.calories : undefined}
        />
        <StatCard
          title={t("Proteína")}
          value={`${summary?.total_protein ?? 0} g`}
          subtitle={goal ? `${t("Objetivo")}: ${goal.protein} g` : undefined}
          progress={progress ? progress.protein : undefined}
        />
        <StatCard
          title={t("Carbohidratos")}
          value={`${summary?.total_carbs ?? 0} g`}
          subtitle={goal ? `${t("Objetivo")}: ${goal.carbs} g` : undefined}
          progress={progress ? progress.carbs : undefined}
        />
        <StatCard
          title={t("Grasa")}
          value={`${summary?.total_fat ?? 0} g`}
          subtitle={goal ? `${t("Objetivo")}: ${goal.fat} g` : undefined}
          progress={progress ? progress.fat : undefined}
        />
      </Box>
      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="center"
          >
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={Math.min(caloriePercent, 100)}
                size={120}
                thickness={5}
                color={
                  caloriePercent <= 70
                    ? "success"
                    : caloriePercent <= 100
                      ? "warning"
                      : "error"
                }
              />
              <Box
                sx={{
                  inset: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ fontWeight: 950 }}>
                  {caloriePercent}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                {t("Estado del día")}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {dailyMessage}
              </Typography>

              {goal?.calories && (
                <Typography sx={{ mt: 1, fontWeight: 800 }}>
                  {summary?.total_calories ?? 0} / {goal.calories} kcal
                </Typography>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ===== FILA 2: Gráfico grande (2 cards) + card lateral ===== */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {/* Gráfico grande: ocupa 2 columnas (2 “cards”) en lg */}
        <Card sx={{ gridColumn: { xs: "auto", lg: "span 2" } }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 950 }}>
                  {t("Calorías · últimos 7 días")}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("Tendencia diaria (kcal). Día seleccionado incluido.")}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip size="small" label={`${lastKcal} ${t("kcal hoy")}`} />
                <Chip size="small" variant="outlined" label={`${t("Media")}: ${weekAvg} kcal`} />
              </Stack>
            </Box>

            <Box sx={{ mt: 2, color: "text.primary" }}>
              <Sparkline values={week.calories} height={160} />
            </Box>

            <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", gap: 1 }}>
              {week.labels.map((l) => (
                <Typography key={l} variant="caption" color="text.secondary">
                  {l}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Card lateral (puedes cambiar el contenido) */}
        <Card sx={{ gridColumn: { xs: "auto", lg: "span 2" } }}>
          <CardContent>
            <Typography sx={{ fontWeight: 950 }}>
              {t("Resumen semanal")}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("Un vistazo rápido a tu media y al objetivo.")}
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
              <Chip label={`${t("Media 7 días")}: ${weekAvg} kcal`} />
              {goal?.calories ? (
                <Chip
                  variant="outlined"
                  label={`${t("Objetivo diario")}: ${goal.calories} kcal`}
                />
              ) : (
                <Chip variant="outlined" label={t("Sin objetivo configurado")} />)
              }
            </Box>

            {goal?.calories ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {weekAvg <= goal.calories
                  ? t("Vas por debajo o en tu objetivo medio semanal ✅")
                  : t("Tu media semanal está por encima del objetivo ⚠️")}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Box>

      {/* ===== DETALLE ===== */}
      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 950 }}>{t("Detalle")}</Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t("Alimentos registrados en el día seleccionado.")}
          </Typography>

          {biggestMeals.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>
                {t("Comidas con más calorías")}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {biggestMeals.map((m, idx) => (
                  <Chip
                    key={`${m.food}-${idx}`}
                    label={`${idx + 1}. ${m.food} · ${m.calories} kcal`}
                    color={idx === 0 ? "warning" : "default"}
                    variant={idx === 0 ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            {(summary?.meals || []).length === 0 ? (
              <Typography color="text.secondary">
                {t("No hay comidas registradas.")}
              </Typography>
            ) : (
              (summary.meals || []).map((m, idx) => (
                <Box
                  key={`${m.food}-${idx}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>{m.food}</Typography>
                  <Chip size="small" label={`${m.quantity} g`} />
                  <Chip size="small" variant="outlined" label={`${m.calories} kcal`} />
                </Box>
              ))
            )}
          </Box>

          {goal && summary && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
              <Chip
                color={summary.total_calories <= goal.calories ? "success" : "warning"}
                label={
                  summary.total_calories <= goal.calories
                    ? t("✅ Calorías OK")
                    : t("⚠️ Calorías altas")
                }
              />
              <Chip
                color={summary.total_protein >= goal.protein ? "success" : "warning"}
                label={
                  summary.total_protein >= goal.protein
                    ? t("✅ Proteína OK")
                    : t("⚠️ Proteína baja")
                }
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
