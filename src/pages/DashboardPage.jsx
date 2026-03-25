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
} from "@mui/material";
import StatCard from "../components/StatCard";
import Sparkline from "../components/Sparkline";
import { getDailySummary, getGoal } from "../api";
import { useAuth } from "../context/AuthContext";

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [day, setDay] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState("");
  const [week, setWeek] = useState({ labels: [], calories: [] });

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
      setError(e?.message || "No se pudo cargar el resumen");
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
      calories: goal.calories ? clamp01(summary.total_calories / goal.calories) : 0,
      protein: goal.protein ? clamp01(summary.total_protein / goal.protein) : 0,
      carbs: goal.carbs ? clamp01(summary.total_carbs / goal.carbs) : 0,
      fat: goal.fat ? clamp01(summary.total_fat / goal.fat) : 0,
    };
  }, [goal, summary]);

  const lastKcal = week.calories.at(-1) ?? 0;
  const weekAvg =
    week.calories.length > 0
      ? Math.round(week.calories.reduce((a, b) => a + (Number(b) || 0), 0) / week.calories.length)
      : 0;

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Resumen
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Total del día y progreso frente a tus objetivos.
          </Typography>
        </Box>

        <TextField
          label="Día"
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!goal && (
        <Alert severity="info">
          Aún no tienes objetivos configurados. Ve a “Objetivos” para establecerlos.
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
          title="Calorías"
          value={`${summary?.total_calories ?? 0} kcal`}
          subtitle={goal ? `Objetivo: ${goal.calories} kcal` : undefined}
          progress={progress ? progress.calories : undefined}
        />
        <StatCard
          title="Proteína"
          value={`${summary?.total_protein ?? 0} g`}
          subtitle={goal ? `Objetivo: ${goal.protein} g` : undefined}
          progress={progress ? progress.protein : undefined}
        />
        <StatCard
          title="Carbohidratos"
          value={`${summary?.total_carbs ?? 0} g`}
          subtitle={goal ? `Objetivo: ${goal.carbs} g` : undefined}
          progress={progress ? progress.carbs : undefined}
        />
        <StatCard
          title="Grasa"
          value={`${summary?.total_fat ?? 0} g`}
          subtitle={goal ? `Objetivo: ${goal.fat} g` : undefined}
          progress={progress ? progress.fat : undefined}
        />
      </Box>

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
                <Typography sx={{ fontWeight: 950 }}>Calorías · últimos 7 días</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Tendencia diaria (kcal). Día seleccionado incluido.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip size="small" label={`${lastKcal} kcal hoy`} />
                <Chip size="small" variant="outlined" label={`Media: ${weekAvg} kcal`} />
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
            <Typography sx={{ fontWeight: 950 }}>Resumen semanal</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Un vistazo rápido a tu media y al objetivo.
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
              <Chip label={`Media 7 días: ${weekAvg} kcal`} />
              {goal?.calories ? (
                <Chip
                  variant="outlined"
                  label={`Objetivo diario: ${goal.calories} kcal`}
                />
              ) : (
                <Chip variant="outlined" label="Sin objetivo configurado" />
              )}
            </Box>

            {goal?.calories ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {weekAvg <= goal.calories
                  ? "Vas por debajo o en tu objetivo medio semanal ✅"
                  : "Tu media semanal está por encima del objetivo ⚠️"}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Box>

      {/* ===== DETALLE ===== */}
      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 950 }}>Detalle</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Alimentos registrados en el día seleccionado.
          </Typography>

          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            {(summary?.meals || []).length === 0 ? (
              <Typography color="text.secondary">No hay comidas registradas.</Typography>
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
                label={summary.total_calories <= goal.calories ? "✅ Calorías OK" : "⚠️ Calorías altas"}
              />
              <Chip
                color={summary.total_protein >= goal.protein ? "success" : "warning"}
                label={summary.total_protein >= goal.protein ? "✅ Proteína OK" : "⚠️ Proteína baja"}
              />
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
