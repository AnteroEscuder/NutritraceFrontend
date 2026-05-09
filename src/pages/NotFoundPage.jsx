import { Box, Button, Typography } from "@mui/material";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 3,
        textAlign: "center",
      }}
    >
      <Box>
        <SentimentDissatisfiedIcon
          sx={{
            fontSize: 90,
            opacity: 0.8,
            mb: 2,
          }}
        />

        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            lineHeight: 1,
            mb: 1,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mb: 1,
          }}
        >
          {t("Página no encontrada")}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: 420,
            mx: "auto",
          }}
        >
          {t(
            "La página que intentas abrir no existe o fue movida."
          )}
        </Typography>

        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
        >
          {t("Volver al inicio")}
        </Button>
      </Box>
    </Box>
  );
}