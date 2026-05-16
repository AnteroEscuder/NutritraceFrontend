import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function PageHero({
  chipIcon,
  chipLabel,
  chipColor = "primary",
  title,
  subtitle,
  actions,
  children,
  accent = "primary",
  secondaryAccent = "secondary",
  contentSx,
}) {
  const theme = useTheme();
  const accentPalette = theme.palette[accent] || theme.palette.primary;
  const secondaryPalette = theme.palette[secondaryAccent] || theme.palette.secondary;

  return (
    <Card
      sx={{
        overflow: "hidden",
        border: `1px solid ${alpha(accentPalette.main, 0.14)}`,
        boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.07)}`,
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.25, md: 3 },
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(accentPalette.dark || accentPalette.main, 0.28)}, ${alpha(theme.palette.background.paper, 0.9)})`
              : `linear-gradient(135deg, ${alpha(accentPalette.light || accentPalette.main, 0.18)}, ${alpha(secondaryPalette.light || secondaryPalette.main, 0.1)})`,
          ...contentSx,
        }}
      >
        {children || (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: actions ? "1fr auto" : "1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {chipLabel && (
                <Chip
                  icon={chipIcon}
                  label={chipLabel}
                  color={chipColor}
                  sx={{ fontWeight: 850, mb: 2 }}
                />
              )}
              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: 0, lineHeight: 1.08 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 650 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
