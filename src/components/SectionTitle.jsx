import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function SectionTitle({
  icon,
  title,
  subtitle,
  color = "primary",
  sx,
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", ...sx }}>
      <Avatar sx={{ bgcolor: (theme) => alpha(theme.palette[color].main, 0.12), color: `${color}.main` }}>
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
