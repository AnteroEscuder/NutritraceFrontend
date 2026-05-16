import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ScaleIcon from "@mui/icons-material/Scale";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import {
  createMeal,
  deleteMeal,
  getMyAllergies,
  listFoods,
  listMeals,
  updateMeal,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import ConfirmDialog from "../components/ConfirmDialog";

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

export default function MealsPage() {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const theme = useTheme();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [day, setDay] = useState(todayISO());
  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
  const [myAllergies, setMyAllergies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ foodId: "", quantity: "100" });
  const [saving, setSaving] = useState(false);

  const foodsById = useMemo(() => {
    const map = new Map();
    foods.forEach((f) => map.set(String(f.id), f));
    return map;
  }, [foods]);

  const selectedFood = useMemo(() => {
    return foodsById.get(String(form.foodId));
  }, [foodsById, form.foodId]);

  const myAllergyIds = useMemo(() => {
    return new Set(myAllergies.map((a) => String(a.id)));
  }, [myAllergies]);

  const allergyWarning = useMemo(() => {
    if (!selectedFood?.allergens?.length || !myAllergyIds.size) return [];

    return selectedFood.allergens.filter((a) =>
      myAllergyIds.has(String(a.id))
    );
  }, [selectedFood, myAllergyIds]);

  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const m of meals) {
      const qty = toNumber(m.quantity ?? 0) / 100;
      const fallbackFood = foodsById.get(String(m.food_id ?? m.foodId ?? ""));

      const cal100 = toNumber(m.calories ?? fallbackFood?.calories ?? 0);
      const pro100 = toNumber(m.protein ?? fallbackFood?.protein ?? 0);
      const car100 = toNumber(m.carbs ?? fallbackFood?.carbs ?? 0);
      const fat100 = toNumber(m.fat ?? fallbackFood?.fat ?? 0);

      calories += cal100 * qty;
      protein += pro100 * qty;
      carbs += car100 * qty;
      fat += fat100 * qty;
    }

    return {
      calories: round2(calories),
      protein: round2(protein),
      carbs: round2(carbs),
      fat: round2(fat),
    };
  }, [meals, foodsById]);

  const mealStats = useMemo(() => {
    const totalQuantity = meals.reduce((sum, meal) => sum + toNumber(meal.quantity), 0);
    const allergenMatches = meals.reduce((sum, meal) => {
      const food = foodsById.get(String(meal.food_id ?? meal.foodId ?? ""));
      const matches = (food?.allergens || []).some((a) => myAllergyIds.has(String(a.id)));
      return sum + (matches ? 1 : 0);
    }, 0);

    return { totalQuantity: round2(totalQuantity), allergenMatches };
  }, [foodsById, meals, myAllergyIds]);

  const loadAll = async () => {
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const [foodsData, mealsData, allergiesData] = await Promise.all([
        listFoods({ token }),
        listMeals({ token, day }),
        getMyAllergies(token),
      ]);

      setFoods(Array.isArray(foodsData) ? foodsData : []);
      setMeals(Array.isArray(mealsData) ? mealsData : []);
      setMyAllergies(Array.isArray(allergiesData) ? allergiesData : []);
    } catch (e) {
      setError(e?.message || t("No se pudieron cargar las comidas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, day]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      foodId: foods[0]?.id ? String(foods[0].id) : "",
      quantity: "100",
    });
    setDialogOpen(true);
  };

  const openEdit = (meal) => {
    setEditing(meal);
    setForm({
      foodId: String(meal.food_id ?? meal.foodId ?? ""),
      quantity: String(meal.quantity ?? "100"),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSaving(false);
  };

  const save = async () => {
    if (!token) return;

    setError("");
    setSaving(true);

    try {
      const payload = {
        user_id: user?.id,
        food_id: Number(form.foodId),
        quantity: toNumber(form.quantity),
        date: day,
      };

      if (editing?.id) {
        const updated = await updateMeal({
          token,
          id: editing.id,
          payload,
        });

        setMeals((prev) =>
          prev.map((m) => (m.id === editing.id ? updated : m))
        );
      } else {
        const created = await createMeal({ token, payload });
        setMeals((prev) => [created, ...prev]);
      }

      closeDialog();
    } catch (e) {
      setError(e?.message || t("No se pudo guardar la comida"));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!token || !deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await deleteMeal({ token, id: deleteTarget.id });

      setMeals((prev) =>
        prev.filter((m) => m.id !== deleteTarget.id)
      );

      setDeleteTarget(null);
    } catch (e) {
      setError(e?.message || t("No se pudo borrar"));
    } finally {
      setDeleting(false);
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
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.24)}, ${alpha(theme.palette.background.paper, 0.9)})`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)}, ${alpha(theme.palette.success.light, 0.1)})`,
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
                icon={<RestaurantIcon />}
                label={t("Registro diario")}
                color="primary"
                sx={{ fontWeight: 850, mb: 2 }}
              />
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.08 }}>
                {t("Comidas")}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
                {t("Registra lo que comes y revisa el total diario.")}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
              <TextField
                label={t("Día")}
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 180 }, bgcolor: "background.paper", borderRadius: 2 }}
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                disabled={foods.length === 0}
                sx={{ height: 40, fontWeight: 900 }}
              >
                {t("Añadir")}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {foods.length === 0 && (
        <Alert severity="info">
          {t(
            "Primero crea algún alimento en la sección “Alimentos” para poder registrar comidas."
          )}
        </Alert>
      )}

      {error && <Alert severity="error">{String(error)}</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <MealMetric icon={<LocalFireDepartmentIcon />} label={t("Calorías")} value={`${totals.calories} kcal`} color="error" />
        <MealMetric icon={<RestaurantIcon />} label={t("Comidas")} value={meals.length} color="primary" />
        <MealMetric icon={<ScaleIcon />} label={t("Cantidad total")} value={`${mealStats.totalQuantity} g`} color="success" />
        <MealMetric icon={<WarningAmberIcon />} label={t("Alertas")} value={mealStats.allergenMatches} color="warning" />
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <Box>
              <Typography sx={{ fontWeight: 950 }}>{t("Totales del día")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Resumen nutricional calculado con las cantidades registradas.")}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${totals.protein}g P`} color="primary" variant="outlined" />
              <Chip label={`${totals.carbs}g HC`} color="secondary" variant="outlined" />
              <Chip label={`${totals.fat}g G`} color="warning" variant="outlined" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2 }}>
        {loading && meals.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                {t("Cargando…")}
              </Typography>
            </CardContent>
          </Card>
        ) : meals.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 900 }}>
                {t("Sin registros")}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {t("Añade una comida para este día.")}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          meals.map((m) => {
            const f = foodsById.get(String(m.food_id ?? ""));
            const name = m.food_name || f?.name || `${t("Alimento")} #${m.food_id}`;
            const kcal = m.calories != null ? m.calories : f?.calories;

            const mealAllergyWarning = (f?.allergens || []).filter((a) =>
              myAllergyIds.has(String(a.id))
            );

            const quantityFactor = toNumber(m.quantity) / 100;

            return (
              <Card
                key={m.id}
                sx={{
                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 14px 34px ${alpha(theme.palette.common.black, 0.09)}`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                      <RestaurantIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950 }} noWrap>
                        {name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {toNumber(m.quantity)} g
                        {kcal != null ? ` · ${kcal} kcal/100g` : ""}
                      </Typography>

                      {mealAllergyWarning.length > 0 && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          {t("Este alimento contiene")}:{" "}
                          <b>
                            {mealAllergyWarning
                              .map((a) => t(a.name))
                              .join(", ")}
                          </b>
                        </Alert>
                      )}
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      <IconButton onClick={() => openEdit(m)} aria-label={t("Editar")}>
                        <EditIcon />
                      </IconButton>

                      <IconButton onClick={() => setDeleteTarget(m)} aria-label={t("Borrar")}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`kcal: ${round2(
                        toNumber(kcal ?? 0) * quantityFactor
                      )}`}
                      variant="outlined"
                    />

                    <Chip
                      label={`P: ${round2(
                        toNumber(m.protein ?? f?.protein ?? 0) * quantityFactor
                      )}g`}
                      variant="outlined"
                    />

                    <Chip
                      label={`HC: ${round2(
                        toNumber(m.carbs ?? f?.carbs ?? 0) * quantityFactor
                      )}g`}
                      variant="outlined"
                    />

                    <Chip
                      label={`G: ${round2(
                        toNumber(m.fat ?? f?.fat ?? 0) * quantityFactor
                      )}g`}
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>
          {editing ? t("Editar comida") : t("Añadir comida")}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              select
              label={t("Alimento")}
              value={form.foodId}
              onChange={(e) =>
                setForm((p) => ({ ...p, foodId: e.target.value }))
              }
              fullWidth
            >
              {foods.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>

            {allergyWarning.length > 0 && (
              <Alert severity="warning">
                ⚠️ {t("Este alimento contiene alérgenos que has marcado.")}{" "}
                <b>{allergyWarning.map((a) => t(a.name)).join(", ")}</b>
              </Alert>
            )}

            <TextField
              label={t("Cantidad (g)")}
              type="number"
              inputProps={{ step: "1", min: "1" }}
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>{t("Cancelar")}</Button>

          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !form.foodId}
          >
            {saving ? t("Guardando…") : t("Guardar")}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("Eliminar comida")}
        message={
          deleteTarget
            ? t("¿Seguro que quieres borrar este registro?")
            : ""
        }
        confirmText={t("Eliminar")}
        cancelText={t("Cancelar")}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </Box>
  );
}

function MealMetric({ icon, label, value, color = "primary" }) {
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
