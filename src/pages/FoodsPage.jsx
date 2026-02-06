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
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

import { createFood, deleteFood, listFoods, updateFood } from "../api";
import { useAuth } from "../context/AuthContext";

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function emptyForm() {
  return { name: "", calories: "", protein: "", carbs: "", fat: "" };
}

export default function FoodsPage() {
  const { token } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => (f.name || "").toLowerCase().includes(q));
  }, [items, search]);

  const load = async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const data = await listFoods({ token });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar la lista de alimentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (food) => {
    setEditing(food);
    setForm({
      name: food.name ?? "",
      calories: String(food.calories ?? ""),
      protein: String(food.protein ?? ""),
      carbs: String(food.carbs ?? ""),
      fat: String(food.fat ?? ""),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        calories: toNumber(form.calories),
        protein: toNumber(form.protein),
        carbs: toNumber(form.carbs),
        fat: toNumber(form.fat),
      };

      if (editing?.id) {
        const updated = await updateFood({ token, id: editing.id, payload });
        setItems((prev) => prev.map((x) => (x.id === editing.id ? updated : x)));
      } else {
        const created = await createFood({ token, payload });
        setItems((prev) => [created, ...prev]);
      }

      closeDialog();
    } catch (e) {
      setError(e?.message || "No se pudo guardar el alimento");
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (!token) return;
    if (!window.confirm(`¿Borrar "${food.name}"?`)) return;
    setError("");
    try {
      await deleteFood({ token, id: food.id });
      setItems((prev) => prev.filter((x) => x.id !== food.id));
    } catch (e) {
      setError(e?.message || "No se pudo borrar el alimento");
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Alimentos
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Crea tu base de alimentos y reutilízalos al registrar comidas.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Nuevo
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              placeholder="Buscar alimento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} />,
              }}
              fullWidth
            />
            <Chip
              label={`${filtered.length} / ${items.length}`}
              variant="outlined"
              sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
        {loading && items.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">Cargando…</Typography>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 900 }}>No hay alimentos todavía</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Pulsa “Nuevo” para crear el primero.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card key={f.id}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 950 }} noWrap>
                      {f.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {Number(f.calories ?? 0)} kcal · {Number(f.protein ?? 0)}g P · {Number(f.carbs ?? 0)}g HC · {Number(f.fat ?? 0)}g G
                    </Typography>
                  </Box>
                  <IconButton onClick={() => openEdit(f)} aria-label="Editar">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(f)} aria-label="Borrar">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>
          {editing ? "Editar alimento" : "Nuevo alimento"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="Calorías"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
              />
              <TextField
                label="Proteína (g)"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.protein}
                onChange={(e) => setForm((p) => ({ ...p, protein: e.target.value }))}
              />
              <TextField
                label="Carbohidratos (g)"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.carbs}
                onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
              />
              <TextField
                label="Grasa (g)"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.fat}
                onChange={(e) => setForm((p) => ({ ...p, fat: e.target.value }))}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
