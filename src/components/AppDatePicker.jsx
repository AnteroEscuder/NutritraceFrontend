import { useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function AppDatePicker({
  value,
  onChange,
  label,
  todayLabel,
  selectLabel,
  formattedValue,
  todayValue,
  isToday,
  sx,
}) {
  const theme = useTheme();
  const inputRef = useRef(null);

  const openNativePicker = () => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  };

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: 276 },
        ml: { sm: "auto" },
        alignSelf: "flex-start",
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1,
        borderRadius: 3,
        color: "common.white",
        bgcolor: alpha(theme.palette.common.black, 0.28),
        border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
        boxShadow: `0 10px 26px ${alpha(theme.palette.common.black, 0.18)}`,
        backdropFilter: "blur(10px)",
        ...sx,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={openNativePicker}
        sx={{
          appearance: "none",
          border: 0,
          p: 0,
          m: 0,
          bgcolor: "transparent",
          cursor: "pointer",
          font: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          minWidth: 0,
          flex: 1,
          textAlign: "left",
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.25,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "common.white",
            bgcolor: alpha(theme.palette.common.white, 0.14),
          }}
        >
          <CalendarTodayIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.common.white, 0.76),
              display: "block",
              lineHeight: 1.1,
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ color: "common.white", fontWeight: 950, textTransform: "capitalize" }} noWrap>
            {formattedValue}
          </Typography>
        </Box>
      </Box>

      {todayLabel && todayValue && (
        <Button
          size="small"
          variant={isToday ? "contained" : "outlined"}
          onClick={() => onChange(todayValue)}
          sx={{
            minWidth: 56,
            borderRadius: 2,
            fontWeight: 900,
            px: 1.25,
            color: isToday ? "primary.contrastText" : "common.white",
            borderColor: alpha(theme.palette.common.white, 0.42),
            "&:hover": {
              borderColor: alpha(theme.palette.common.white, 0.72),
              bgcolor: isToday ? undefined : alpha(theme.palette.common.white, 0.1),
            },
          }}
        >
          {todayLabel}
        </Button>
      )}

      <Box
        component="input"
        ref={inputRef}
        aria-label={selectLabel}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
