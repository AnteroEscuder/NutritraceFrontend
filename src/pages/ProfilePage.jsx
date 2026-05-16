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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AllergyIcon from "@mui/icons-material/Sick";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
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
import {
  API_BASE,
  listAllergens,
  getMyAllergies,
  updateMyAllergies,
  uploadProfilePhoto,
  updateMyProfile,
  deleteProfilePhoto,
} from "../api";
import { useI18n } from "../i18n/I18nContext";

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
  const { user, token, setUser } = useAuth();
  const { t } = useI18n();
  const theme = useTheme();

  const [allergens, setAllergens] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const selectedCount = selectedIds.size;
  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const safeAllergens = Math.max(0, allergens.length - selectedCount);

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setError("");
      setMessage("");

      try {
        setLoading(true);

        const a = await listAllergens();
        setAllergens(Array.isArray(a) ? a : []);

        const my = await getMyAllergies(token);
        setSelectedIds(new Set((Array.isArray(my) ? my : []).map((x) => x.id)));
      } catch (err) {
        console.error(err);
        setError(err.message || t("Error cargando perfil"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, t]);

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
      setMessage(t("Perfil actualizado. Guardado correctamente."));
    } catch (err) {
      console.error(err);
      setError(err.message || t("Error al guardar"));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !token) return;

    try {
      setUploadingPhoto(true);
      setError("");
      setMessage("");

      const updatedUser = await uploadProfilePhoto({
        token,
        file: photoFile,
      });

      setMessage(t("Foto de perfil actualizada correctamente."));
      setPhotoModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview("");

      setUser(updatedUser);
    } catch (err) {
      setError(err.message || t("Error subiendo la foto"));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSavingProfile(true);
      setError("");
      setMessage("");

      const updatedUser = await updateMyProfile({
        token,
        payload: profileForm,
      });

      setUser(updatedUser);
      setMessage(t("Perfil actualizado correctamente."));
    } catch (err) {
      setError(err.message || t("Error actualizando perfil"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!token) return;

    try {
      setDeletingPhoto(true);
      setError("");
      setMessage("");

      const updatedUser = await deleteProfilePhoto(token);

      setUser(updatedUser);
      setPhotoFile(null);
      setPhotoPreview("");
      setMessage(t("Foto de perfil eliminada correctamente."));
    } catch (err) {
      setError(err.message || t("Error eliminando la foto"));
    } finally {
      setDeletingPhoto(false);
    }
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Stack spacing={2.5}>
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
                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.28)}, ${alpha(theme.palette.background.paper, 0.9)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)}, ${alpha(theme.palette.secondary.light, 0.1)})`,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                  gap: 3,
                  alignItems: "center",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Chip
                    icon={<AccountCircleIcon />}
                    label={t("Centro de cuenta")}
                    color="primary"
                    sx={{ fontWeight: 850, mb: 2 }}
                  />
                  <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.08 }}>
                    {t("Cuenta")}
                  </Typography>

                  <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 650 }}>
                    {t("Gestiona tu perfil y selecciona tus alergias para que NutriTrace pueda avisarte.")}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.9 }}>
                    {t("Sesión iniciada como")} <b>{user?.name || t("Usuario")}</b>
                    {user?.email ? ` · ${user.email}` : ""}
                  </Typography>
                </Box>

                <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }}>
                  <Avatar
                    src={
                      user?.profile_image_url
                        ? `${API_BASE}${user.profile_image_url}`
                        : undefined
                    }
                    sx={{
                      width: 104,
                      height: 104,
                      fontSize: 36,
                      fontWeight: 950,
                      border: `4px solid ${alpha(theme.palette.background.paper, 0.9)}`,
                      boxShadow: `0 14px 32px ${alpha(theme.palette.common.black, 0.16)}`,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </Avatar>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ md: "center" }}>
                    <Button variant="contained" startIcon={<CameraAltIcon />} onClick={() => setPhotoModalOpen(true)}>
                      {t("Cambiar foto")}
                    </Button>

                    {user?.profile_image_url && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleDeletePhoto}
                        disabled={deletingPhoto}
                      >
                        {deletingPhoto ? t("Eliminando…") : t("Quitar foto")}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>

            <Dialog
              open={photoModalOpen}
              onClose={() => setPhotoModalOpen(false)}
              fullWidth
              maxWidth="xs"
            >
              <DialogTitle>{t("Cambiar foto de perfil")}</DialogTitle>

              <DialogContent>
                <Stack spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Avatar src={photoPreview} sx={{ width: 120, height: 120 }}>
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </Avatar>

                  <Button variant="contained" component="label">
                    {t("Seleccionar imagen")}
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoChange}
                    />
                  </Button>

                  {photoFile && (
                    <Typography variant="body2" color="text.secondary">
                      {photoFile.name}
                    </Typography>
                  )}
                </Stack>
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setPhotoModalOpen(false)}>
                  {t("Cancelar")}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleUploadPhoto}
                  disabled={!photoFile || uploadingPhoto}
                >
                  {uploadingPhoto ? t("Subiendo...") : t("Guardar foto")}
                </Button>
              </DialogActions>
            </Dialog>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <ProfileMetric icon={<AccountCircleIcon />} label={t("Perfil")} value={user?.name || t("Usuario")} color="primary" />
            <ProfileMetric icon={<AllergyIcon />} label={t("Alergias seleccionadas")} value={selectedCount} color="secondary" />
            <ProfileMetric icon={<LabelIcon />} label={t("Sin marcar")} value={safeAllergens} color="success" />
          </Box>

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
              <Stack component="form" onSubmit={handleUpdateProfile} spacing={2}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" }}>
                    <AccountCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 950 }}>{t("Editar perfil")}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("Mantén actualizados tus datos personales.")}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={t("Nombre")}
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    fullWidth
                    required
                  />

                  <TextField
                    label={t("Email")}
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                    fullWidth
                    required
                  />
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button type="submit" variant="contained" disabled={savingProfile}>
                    {savingProfile ? t("Guardando…") : t("Guardar perfil")}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            {loading && <LinearProgress />}

            <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.12), color: "secondary.main" }}>
                    <AllergyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 0.25, fontWeight: 950 }}>
                      {t("Alergias")}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {selectedCount}{" "}
                      {selectedCount === 1 ? t("seleccionada") : t("seleccionadas")}.{" "}
                      {t("Toca un alérgeno para marcarlo o desmarcarlo.")}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={selectAll}
                    disabled={!allergens.length || saving || loading}
                  >
                    {t("Seleccionar todo")}
                  </Button>

                  <Button variant="text" onClick={selectNone} disabled={saving || loading}>
                    {t("Quitar todo")}
                  </Button>

                  <Box sx={{ flex: 1 }} />

                  <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
                    {saving ? t("Guardando…") : t("Guardar cambios")}
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
                        label={t(a.name)}
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
                      {t("No hay alérgenos cargados en el sistema.")}
                    </Typography>
                  )}
                </Box>

                {error && <Alert severity="error">{String(error)}</Alert>}
                {message && <Alert severity="success">{String(message)}</Alert>}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>{t("Cómo se usa")}</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("Esto ayuda a que la app pueda avisarte y filtrar alimentos incompatibles.")}
              </Typography>

              <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5, lineHeight: 1.8 }}>
                <li>{t("Marca aquí tus alérgenos (por ejemplo: Gluten, Lactosa…).")}</li>
                <li>{t("Al registrar comidas, la app podrá avisarte si un alimento los contiene.")}</li>
                <li>{t("Puedes editarlo cuando quieras: se guarda en tu perfil.")}</li>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </AppLayout>
  );
}

function ProfileMetric({ icon, label, value, color = "primary" }) {
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
