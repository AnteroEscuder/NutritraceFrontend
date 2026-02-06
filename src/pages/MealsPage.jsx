import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { createMeal, deleteMeal, listFoods, listMeals, updateMeal } from "../api";
import { useAuth } from "../context/AuthContext";

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

export default function MealsPage() {
  const { token, user } = useAuth();

  const [day, setDay] = useState(todayISO());
  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
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

  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const m of meals) {
      // backend puede devolver food_name/calories... o solo ids.
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
      calories: Math.round(calories * 100) / 100,
      protein: Math.round(protein * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      fat: Math.round(fat * 100) / 100,
    };
  }, [meals, foodsById]);

  const loadAll = async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const [foodsData, mealsData] = await Promise.all([
        listFoods({ token }),
        listMeals({ token, day }),
      ]);
      setFoods(Array.isArray(foodsData) ? foodsData : []);
      setMeals(Array.isArray(mealsData) ? mealsData : []);
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las comidas");
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
    setForm({ foodId: foods[0]?.id ? String(foods[0].id) : "", quantity: "100" });
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
        const updated = await updateMeal({ token, id: editing.id, payload });
        setMeals((prev) => prev.map((m) => (m.id === editing.id ? updated : m)));
      } else {
        const created = await createMeal({ token, payload });
        setMeals((prev) => [created, ...prev]);
      }
      closeDialog();
    } catch (e) {
      setError(e?.message || "No se pudo guardar la comida");
      setSaving(false);
    }
  };

  const remove = async (meal) => {
    if (!token) return;
    if (!window.confirm("¿Borrar este registro?") ) return;
    setError("");
    try {
      await deleteMeal({ token, id: meal.id });
      setMeals((prev) => prev.filter((m) => m.id !== meal.id));
    } catch (e) {
      setError(e?.message || "No se pudo borrar");
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Comidas
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Registra lo que comes y revisa el total diario.
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={foods.length === 0}>
          Añadir
        </Button>
      </Box>

      {foods.length === 0 && (
        <Alert severity="info">
          Primero crea algún alimento en la sección “Alimentos” para poder registrar comidas.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 950 }}>Totales del día</Typography>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${totals.calories} kcal`} />
              <Chip label={`${totals.protein}g P`} />
              <Chip label={`${totals.carbs}g HC`} />
              <Chip label={`${totals.fat}g G`} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2 }}>
        {loading && meals.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">Cargando…</Typography>
            </CardContent>
          </Card>
        ) : meals.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 900 }}>Sin registros</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Añade una comida para este día.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          meals.map((m) => {
            const f = foodsById.get(String(m.food_id ?? ""));
            const name = m.food_name || f?.name || `Alimento #${m.food_id}`;
            const kcal = m.calories != null ? m.calories : f?.calories;
            return (
              <Card key={m.id}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 950 }} noWrap>
                        {name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {toNumber(m.quantity)} g
                        {kcal != null ? ` · ${kcal} kcal/100g` : ""}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => openEdit(m)} aria-label="Editar">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => remove(m)} aria-label="Borrar">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`kcal: ${Math.round((toNumber(kcal ?? 0) * (toNumber(m.quantity) / 100)) * 100) / 100}`} variant="outlined" />
                    <Chip label={`P: ${Math.round((toNumber(m.protein ?? f?.protein ?? 0) * (toNumber(m.quantity) / 100)) * 100) / 100}g`} variant="outlined" />
                    <Chip label={`HC: ${Math.round((toNumber(m.carbs ?? f?.carbs ?? 0) * (toNumber(m.quantity) / 100)) * 100) / 100}g`} variant="outlined" />
                    <Chip label={`G: ${Math.round((toNumber(m.fat ?? f?.fat ?? 0) * (toNumber(m.quantity) / 100)) * 100) / 100}g`} variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>{editing ? "Editar comida" : "Añadir comida"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              select
              label="Alimento"
              value={form.foodId}
              onChange={(e) => setForm((p) => ({ ...p, foodId: e.target.value }))}
              fullWidth
            >
              {foods.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cantidad (g)"
              type="number"
              inputProps={{ step: "1", min: "1" }}
              value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={saving || !form.foodId}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
