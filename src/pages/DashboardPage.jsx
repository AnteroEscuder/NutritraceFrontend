import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FlagIcon from "@mui/icons-material/Flag";
import InsightsIcon from "@mui/icons-material/Insights";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StatCard from "../components/StatCard";
import Sparkline from "../components/Sparkline";
import AppDatePicker from "../components/AppDatePicker";
import { getDailySummary, getGoal } from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { formatDateLabel, formatNumber, todayISO } from "../utils/format";

function safeRatio(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const theme = useTheme();
  const { lang, t } = useI18n();
  const [day, setDay] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [week, setWeek] = useState({ labels: [], calories: [] });

  const load = useCallback(async () => {
    if (!token || !user?.id) return;
    setError("");
    setLoading(true);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(day);
      d.setDate(d.getDate() - (6 - i));
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60 * 1000);
      return local.toISOString().slice(0, 10);
    });

    try {
      const [s, g, weekSummaries] = await Promise.all([
        getDailySummary({ userId: user.id, date: day, token }),
        getGoal(token).catch(() => null),
        Promise.all(
          days.map((date) =>
            getDailySummary({ userId: user.id, date, token }).catch(() => null)
          )
        ),
      ]);

      setSummary(s);
      setGoal(g);
      setWeek({
        labels: days.map((d) => d.slice(5)),
        calories: weekSummaries.map((item) => item?.total_calories ?? 0),
      });
    } catch (e) {
      setSummary(null);
      setError(e?.message || t("No se pudo cargar el resumen"));
    } finally {
      setLoading(false);
    }
  }, [day, t, token, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = useMemo(() => {
    if (!goal || !summary) return null;
    return {
      calories: goal.calories ? safeRatio(summary.total_calories / goal.calories) : 0,
      protein: goal.protein ? safeRatio(summary.total_protein / goal.protein) : 0,
      carbs: goal.carbs ? safeRatio(summary.total_carbs / goal.carbs) : 0,
      fat: goal.fat ? safeRatio(summary.total_fat / goal.fat) : 0,
    };
  }, [goal, summary]);

  const meals = summary?.meals || [];
  const calories = Number(summary?.total_calories ?? 0);
  const protein = Number(summary?.total_protein ?? 0);
  const carbs = Number(summary?.total_carbs ?? 0);
  const fat = Number(summary?.total_fat ?? 0);
  const lastKcal = week.calories.at(-1) ?? 0;
  const previousKcal = week.calories.at(-2) ?? 0;
  const dailyDelta = Math.round(lastKcal - previousKcal);
  const weekAvg =
    week.calories.length > 0
      ? Math.round(week.calories.reduce((a, b) => a + (Number(b) || 0), 0) / week.calories.length)
      : 0;
  const bestDay = week.calories.length
    ? week.calories.reduce(
        (best, value, index) => (Number(value) > Number(best.value) ? { value, index } : best),
        { value: 0, index: 0 }
      )
    : { value: 0, index: 0 };

  const caloriePercent =
    goal?.calories && summary ? Math.round((calories / Number(goal.calories)) * 100) : 0;
  const remainingCalories = goal?.calories ? Math.round(Number(goal.calories) - calories) : 0;

  const biggestMeals = [...meals]
    .sort((a, b) => Number(b.calories || 0) - Number(a.calories || 0))
    .slice(0, 4);

  const macroRows = [
    {
      label: t("Proteína"),
      value: protein,
      goal: goal?.protein,
      unit: "g",
      color: theme.palette.primary.main,
    },
    {
      label: t("Carbohidratos"),
      value: carbs,
      goal: goal?.carbs,
      unit: "g",
      color: theme.palette.secondary.main,
    },
    {
      label: t("Grasa"),
      value: fat,
      goal: goal?.fat,
      unit: "g",
      color: theme.palette.warning.main,
    },
  ];

  const dailyMessage = !goal
    ? t("Configura tus objetivos para ver recomendaciones.")
    : caloriePercent < 70
      ? t("Vas bastante bien, aún tienes margen para completar tu objetivo.")
      : caloriePercent <= 100
        ? t("Estás cerca de tu objetivo diario.")
        : t("Has superado tu objetivo diario de calorías.");

  const statusColor =
    caloriePercent <= 70 ? "success" : caloriePercent <= 100 ? "warning" : "error";

  const pageBg =
    theme.palette.mode === "dark"
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.32)}, ${alpha(
          theme.palette.background.paper,
          0.86
        )})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.24)}, ${alpha(
          theme.palette.success.light,
          0.14
        )})`;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Card
        sx={{
          overflow: "hidden",
          bgcolor: "background.paper",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
          boxShadow: `0 18px 50px ${alpha(theme.palette.common.black, 0.08)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.65fr" },
              gap: 3,
              alignItems: "stretch",
            }}
          >
            <Box
              sx={{
                borderRadius: 3,
                p: { xs: 2.25, md: 3 },
                minHeight: 250,
                bgcolor: alpha(theme.palette.background.default, 0.58),
                background: pageBg,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 3,
              }}
            >
              <Box
                sx={{
                  position: { xs: "static", md: "absolute" },
                  top: { md: 18 },
                  right: { md: 18 },
                  zIndex: 2,
                  mb: { xs: 1, md: 0 },
                }}
              >
                <AppDatePicker
                  value={day}
                  onChange={setDay}
                  label={t("Fecha de análisis")}
                  todayLabel={t("Hoy")}
                  selectLabel={t("Seleccionar fecha")}
                  formattedValue={formatDateLabel(day, lang)}
                  todayValue={todayISO()}
                  isToday={day === todayISO()}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0, maxWidth: { md: "calc(100% - 320px)" } }}>
                  <Chip
                    icon={<AutoAwesomeIcon />}
                    label={t("Panel nutricional")}
                    color="primary"
                    sx={{ fontWeight: 800, mb: 2 }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.1 }}>
                    {t("Tu progreso de hoy")}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                    {dailyMessage}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t("Consumido")}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: 0 }}>
                    {formatNumber(calories)}
                  </Typography>
                  <Typography color="text.secondary">kcal</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t("Restante")}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: 0 }}>
                    {goal?.calories ? formatNumber(Math.max(remainingCalories, 0)) : "--"}
                  </Typography>
                  <Typography color="text.secondary">kcal</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t("Comidas")}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 950, letterSpacing: 0 }}>
                    {meals.length}
                  </Typography>
                  <Typography color="text.secondary">{t("registros")}</Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                borderRadius: 3,
                p: { xs: 2.25, md: 3 },
                border: `1px solid ${theme.palette.divider}`,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={168}
                  thickness={4.5}
                  sx={{ color: alpha(theme.palette.text.primary, 0.08) }}
                />
                <CircularProgress
                  variant="determinate"
                  value={clampPercent(caloriePercent)}
                  size={168}
                  thickness={4.5}
                  color={statusColor}
                  sx={{ position: "absolute", left: 0 }}
                />
                <Box
                  sx={{
                    inset: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0 }}>
                    {caloriePercent}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("del objetivo")}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ mt: 2, fontWeight: 900 }}>{t("Estado del día")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {goal?.calories
                  ? `${formatNumber(calories)} / ${formatNumber(goal.calories)} kcal`
                  : t("Sin objetivo configurado")}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{String(error)}</Alert>}

      {!goal && (
        <Alert severity="info">
          {t("Aún no tienes objetivos configurados. Ve a “Objetivos” para establecerlos.")}
        </Alert>
      )}

      {loading && (
        <LinearProgress sx={{ borderRadius: 999, height: 6 }} aria-label={t("Cargando…")} />
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          title={t("Calorías")}
          value={`${formatNumber(calories)} kcal`}
          subtitle={goal ? `${t("Objetivo")}: ${formatNumber(goal.calories)} kcal` : undefined}
          progress={progress ? progress.calories : undefined}
        />
        <StatCard
          title={t("Proteína")}
          value={`${formatNumber(protein, 1)} g`}
          subtitle={goal ? `${t("Objetivo")}: ${formatNumber(goal.protein, 1)} g` : undefined}
          progress={progress ? progress.protein : undefined}
        />
        <StatCard
          title={t("Carbohidratos")}
          value={`${formatNumber(carbs, 1)} g`}
          subtitle={goal ? `${t("Objetivo")}: ${formatNumber(goal.carbs, 1)} g` : undefined}
          progress={progress ? progress.carbs : undefined}
        />
        <StatCard
          title={t("Grasa")}
          value={`${formatNumber(fat, 1)} g`}
          subtitle={goal ? `${t("Objetivo")}: ${formatNumber(goal.fat, 1)} g` : undefined}
          progress={progress ? progress.fat : undefined}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.65fr" },
          gap: 2,
        }}
      >
        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                    <ShowChartIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>
                      {t("Calorías · últimos 7 días")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("Tendencia diaria (kcal). Día seleccionado incluido.")}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Chip size="small" label={`${formatNumber(lastKcal)} ${t("kcal hoy")}`} />
                <Chip
                  size="small"
                  variant="outlined"
                  color={dailyDelta <= 0 ? "success" : "default"}
                  label={`${dailyDelta >= 0 ? "+" : ""}${formatNumber(dailyDelta)} kcal`}
                />
              </Stack>
            </Box>

            <Box sx={{ mt: 3, color: "primary.main" }}>
              <Sparkline values={week.calories} height={190} strokeWidth={3.5} />
            </Box>

            <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", gap: 1 }}>
              {week.labels.map((label) => (
                <Typography key={label} variant="caption" color="text.secondary">
                  {label}
                </Typography>
              ))}
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <MiniMetric icon={<InsightsIcon />} label={t("Media 7 días")} value={`${formatNumber(weekAvg)} kcal`} />
              <MiniMetric
                icon={<CalendarTodayIcon />}
                label={t("Día más alto")}
                value={`${week.labels[bestDay.index] || "--"} · ${formatNumber(bestDay.value)} kcal`}
              />
              <MiniMetric
                icon={<FlagIcon />}
                label={t("Objetivo diario")}
                value={goal?.calories ? `${formatNumber(goal.calories)} kcal` : t("Sin objetivo")}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2.5 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: "secondary.main" }}>
                <LocalFireDepartmentIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Balance de macros")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Distribución frente a tus objetivos diarios.")}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2.25}>
              {macroRows.map((macro) => {
                const pct = macro.goal ? clampPercent((macro.value / Number(macro.goal)) * 100) : 0;
                return (
                  <Box key={macro.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 850 }}>{macro.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(macro.value, 1)}
                        {macro.unit}
                        {macro.goal ? ` / ${formatNumber(macro.goal, 1)}${macro.unit}` : ""}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        bgcolor: alpha(macro.color, 0.14),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          bgcolor: macro.color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "0.75fr 1.25fr" },
          gap: 2,
        }}
      >
        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.16), color: "warning.dark" }}>
                <RestaurantIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Top comidas")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("Mayores aportes de energía del día.")}
                </Typography>
              </Box>
            </Stack>

            {biggestMeals.length === 0 ? (
              <Typography color="text.secondary">{t("No hay comidas registradas.")}</Typography>
            ) : (
              <Stack spacing={1.5}>
                {biggestMeals.map((meal, index) => (
                  <Box key={`${meal.food}-${index}`}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 850 }} noWrap>
                        {index + 1}. {meal.food}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(meal.calories)} kcal
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calories ? clampPercent((Number(meal.calories || 0) / calories) * 100) : 0}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 2,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 950 }}>{t("Detalle del día")}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("Alimentos registrados en el día seleccionado.")}
                </Typography>
              </Box>
              {goal && summary && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Chip
                    color={calories <= Number(goal.calories) ? "success" : "warning"}
                    label={calories <= Number(goal.calories) ? t("Calorías OK") : t("Calorías altas")}
                  />
                  <Chip
                    color={protein >= Number(goal.protein) ? "success" : "warning"}
                    label={protein >= Number(goal.protein) ? t("Proteína OK") : t("Proteína baja")}
                  />
                </Stack>
              )}
            </Box>

            <Box sx={{ display: "grid", gap: 1 }}>
              {meals.length === 0 ? (
                <Typography color="text.secondary">{t("No hay comidas registradas.")}</Typography>
              ) : (
                meals.map((meal, index) => (
                  <Box
                    key={`${meal.food}-${index}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                      gap: 1,
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.text.primary, 0.035),
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 850 }} noWrap>
                        {meal.food}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(meal.quantity, 1)} g
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                      <Chip size="small" label={`${formatNumber(meal.calories)} kcal`} />
                    </Stack>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function MiniMetric({ icon, label, value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Avatar sx={{ width: 36, height: 36 }}>{icon}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 900 }} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
