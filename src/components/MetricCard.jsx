import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function MetricCard({ icon, label, value, color = "primary" }) {
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
