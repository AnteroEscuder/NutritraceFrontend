import { Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";

export default function StatCard({
  title,
  value,
  subtitle,
  progress, // 0..1 or undefined
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
        {typeof progress === "number" && (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, progress * 100))}
              sx={{ height: 10, borderRadius: 999 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
