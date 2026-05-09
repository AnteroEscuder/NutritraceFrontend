import { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import FlagIcon from "@mui/icons-material/Flag";
import PersonIcon from "@mui/icons-material/Person";
import ForumIcon from "@mui/icons-material/Forum";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { useThemeMode } from "../context/ThemeContext";

import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext";

import { API_BASE } from "../api";

const drawerWidth = 280;

function initials(name) {
  const parts = (name || "U").trim().split(/\s+/);
  return (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const { mode, toggleTheme } = useThemeMode();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);

  const nav = useMemo(
    () => [
      { to: "/", label: t("Resumen"), icon: <DashboardIcon /> },
      { to: "/meals", label: t("Comidas"), icon: <LocalDiningIcon /> },
      { to: "/foods", label: t("Alimentos"), icon: <RestaurantMenuIcon /> },
      { to: "/goals", label: t("Objetivos"), icon: <FlagIcon /> },
      { to: "/community", label: t("Comunidad"), icon: <ForumIcon /> },
      { to: "/profile", label: t("Cuenta"), icon: <PersonIcon /> },
    ],
    [t]
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            src={
              user?.profile_image_url
                ? `${API_BASE}${user.profile_image_url}`
                : undefined
            }
          >
            {user?.name?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} noWrap>
              {user?.name || "NutriTrace"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.25, py: 1 }}>
        {nav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.to}
                selected={active}
                onClick={() => setOpen(false)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 42 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Button fullWidth variant="outlined" color="primary" onClick={logout}>
          {t("Cerrar sesión")}
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5, textAlign: "center" }}
        >
          NutriTrace · Frontend React
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(10px)",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(15,23,42,0.7)"
              : "rgba(246,248,251,0.7)",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setOpen(true)} aria-label={t("Abrir menú")}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            NutriTrace
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Box data-lang-selector sx={{ display: "flex", alignItems: "center", gap: 0.75, mr: 1 }}>
            <Button
              size="small"
              variant={lang === "es" ? "contained" : "outlined"}
              onClick={() => setLang("es")}
            >
              ES
            </Button>
            <Button
              size="small"
              variant={lang === "en" ? "contained" : "outlined"}
              onClick={() => setLang("en")}
            >
              EN
            </Button>
          </Box>
          <IconButton onClick={toggleTheme}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={
                  user?.profile_image_url
                    ? `${API_BASE}${user.profile_image_url}`
                    : undefined
                }
              >
                {user?.name?.[0]}
              </Avatar>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.name}
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{ sx: { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          px: { xs: 2, md: 3 },
          pb: 4,
          pt: 10,
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ px: { xs: 2, md: 3 } }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
