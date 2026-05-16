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
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import NoMealsIcon from "@mui/icons-material/NoMeals";
import PublicIcon from "@mui/icons-material/Public";
import SearchIcon from "@mui/icons-material/Search";
import ConfirmDialog from "../components/ConfirmDialog";

import {
  createFood,
  deleteFood,
  listAllergens,
  listFoods,
  updateFood,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import PageHero from "../components/PageHero";
import MetricCard from "../components/MetricCard";
import { toNumber } from "../utils/format";

function emptyForm() {
  return {
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    allergenIds: [],
  };
}

export default function FoodsPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const theme = useTheme();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [items, setItems] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((f) => {
      const matchesSearch = !q || (f.name || "").toLowerCase().includes(q);
      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "system" && f.is_system) ||
        (sourceFilter === "own" && !f.is_system);

      return matchesSearch && matchesSource;
    });
  }, [items, search, sourceFilter]);

  const foodStats = useMemo(() => {
    const withAllergens = items.filter((item) => item.allergens?.length > 0).length;
    const avgCalories = items.length
      ? Math.round(items.reduce((sum, item) => sum + toNumber(item.calories), 0) / items.length)
      : 0;
    const highProtein = items.filter((item) => toNumber(item.protein) >= 15).length;
    const systemFoods = items.filter((item) => item.is_system).length;

    return { withAllergens, avgCalories, highProtein, systemFoods };
  }, [items]);

  const load = async () => {
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const [foodsData, allergensData] = await Promise.all([
        listFoods({ token }),
        listAllergens(),
      ]);

      setItems(Array.isArray(foodsData) ? foodsData : []);
      setAllergens(Array.isArray(allergensData) ? allergensData : []);
    } catch (e) {
      setError(e?.message || t("No se pudo cargar la lista de alimentos"));
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
      allergenIds: (food.allergens || []).map((a) => a.id),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSaving(false);
  };

  const toggleAllergen = (id) => {
    setForm((prev) => {
      const current = new Set(prev.allergenIds || []);

      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }

      return {
        ...prev,
        allergenIds: Array.from(current),
      };
    });
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
        allergen_ids: form.allergenIds || [],
      };

      if (editing?.id) {
        const updated = await updateFood({
          token,
          id: editing.id,
          payload,
        });

        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? updated : x))
        );
      } else {
        const created = await createFood({ token, payload });
        setItems((prev) => [created, ...prev]);
      }

      closeDialog();
    } catch (e) {
      setError(e?.message || t("No se pudo guardar el alimento"));
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;

    setDeleting(true);
    setError("");

    try {
      await deleteFood({ token, id: deleteTarget.id });

      setItems((prev) =>
        prev.filter((x) => x.id !== deleteTarget.id)
      );

      setDeleteTarget(null);
    } catch (e) {
      setError(e?.message || t("No se pudo borrar el alimento"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSourceFilterChange = (_event, nextValue) => {
    if (nextValue) setSourceFilter(nextValue);
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <PageHero
        chipIcon={<Inventory2Icon />}
        chipLabel={t("Base nutricional")}
        chipColor="secondary"
        title={t("Alimentos")}
        subtitle={t("Usa alimentos de la app o crea los tuyos para registrar comidas.")}
        accent="secondary"
        secondaryAccent="primary"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ height: 42, fontWeight: 900 }}
          >
            {t("Nuevo")}
          </Button>
        }
      />

      {error && <Alert severity="error">{String(error)}</Alert>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <MetricCard icon={<Inventory2Icon />} label={t("Alimentos")} value={items.length} color="primary" />
        <MetricCard icon={<PublicIcon />} label={t("De la app")} value={foodStats.systemFoods} color="info" />
        <MetricCard icon={<SearchIcon />} label={t("Resultados")} value={filtered.length} color="secondary" />
        <MetricCard icon={<LocalFireDepartmentIcon />} label={t("Media kcal")} value={`${foodStats.avgCalories} kcal`} color="error" />
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <TextField
              placeholder={t("Buscar alimento…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} />,
              }}
              fullWidth
            />

            <ToggleButtonGroup
              exclusive
              size="small"
              value={sourceFilter}
              onChange={handleSourceFilterChange}
              aria-label={t("Filtrar alimentos")}
              sx={{
                flexShrink: 0,
                alignSelf: { xs: "stretch", md: "center" },
                "& .MuiToggleButton-root": {
                  px: { xs: 1.25, sm: 1.75 },
                  fontWeight: 900,
                  minWidth: { xs: 0, sm: 86 },
                },
              }}
            >
              <ToggleButton value="all" aria-label={t("Todos")}>
                {t("Todos")}
              </ToggleButton>
              <ToggleButton value="system" aria-label={t("App")}>
                {t("App")}
              </ToggleButton>
              <ToggleButton value="own" aria-label={t("Propios")}>
                {t("Propios")}
              </ToggleButton>
            </ToggleButtonGroup>

            <Chip label={`${filtered.length} / ${items.length}`} variant="outlined" sx={{ alignSelf: { xs: "flex-start", md: "center" } }} />
            <Chip label={`${foodStats.highProtein} ${t("altos en proteína")}`} color="primary" variant="outlined" sx={{ alignSelf: { xs: "flex-start", md: "center" } }} />
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 2,
        }}
      >
        {loading && items.length === 0 ? (
          <Card>
            <CardContent>
              <Typography color="text.secondary">{t("Cargando…")}</Typography>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 900 }}>
                {t("No hay alimentos todavía")}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {t("Pulsa “Nuevo” para crear el primero.")}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filtered.map((f) => (
            <Card
              key={f.id}
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
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: "secondary.main" }}>
                    <NoMealsIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 950 }} noWrap>
                      {f.name}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        icon={f.is_system ? <PublicIcon /> : <Inventory2Icon />}
                        label={f.is_system ? t("App") : t("Propio")}
                        color={f.is_system ? "info" : "default"}
                        variant={f.is_system ? "filled" : "outlined"}
                      />
                      <Chip size="small" label={`${Number(f.calories ?? 0)} kcal`} color="error" variant="outlined" />
                      <Chip size="small" label={`${Number(f.protein ?? 0)}g P`} color="primary" variant="outlined" />
                      <Chip size="small" label={`${Number(f.carbs ?? 0)}g HC`} color="secondary" variant="outlined" />
                      <Chip size="small" label={`${Number(f.fat ?? 0)}g G`} color="warning" variant="outlined" />
                    </Stack>

                    {f.allergens?.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 1.25 }}
                      >
                        {f.allergens.map((a) => (
                          <Chip
                            key={a.id}
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={t(a.name)}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      onClick={() => openEdit(f)}
                      aria-label={t("Editar")}
                      disabled={f.is_system}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      onClick={() => setDeleteTarget(f)}
                      aria-label={t("Borrar")}
                      disabled={f.is_system}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>
          {editing ? t("Editar alimento") : t("Nuevo alimento")}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <TextField
              label={t("Nombre")}
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
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
                label={t("Calorías")}
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.calories}
                onChange={(e) =>
                  setForm((p) => ({ ...p, calories: e.target.value }))
                }
              />

              <TextField
                label={t("Proteína (g)")}
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.protein}
                onChange={(e) =>
                  setForm((p) => ({ ...p, protein: e.target.value }))
                }
              />

              <TextField
                label={t("Carbohidratos (g)")}
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.carbs}
                onChange={(e) =>
                  setForm((p) => ({ ...p, carbs: e.target.value }))
                }
              />

              <TextField
                label={t("Grasa (g)")}
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.fat}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fat: e.target.value }))
                }
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                {t("Alérgenos que contiene")}
              </Typography>

              {allergens.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("No hay alérgenos cargados en el sistema.")}
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {allergens.map((a) => {
                    const selected = form.allergenIds?.includes(a.id);

                    return (
                      <Chip
                        key={a.id}
                        label={t(a.name)}
                        clickable
                        onClick={() => toggleAllergen(a.id)}
                        color={selected ? "warning" : "default"}
                        variant={selected ? "filled" : "outlined"}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog}>{t("Cancelar")}</Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? t("Guardando…") : t("Guardar")}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("Eliminar alimento")}
        message={
          deleteTarget
            ? `${t("¿Seguro que quieres borrar")} "${deleteTarget.name}"?`
            : ""
        }
        confirmText={t("Eliminar")}
        cancelText={t("Cancelar")}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
