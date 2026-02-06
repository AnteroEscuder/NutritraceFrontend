import { Box } from "@mui/material";

export default function Sparkline({ values = [], height = 80, strokeWidth = 3 }) {
  const w = 300;
  const h = height;

  const nums = values.map((v) => Number(v) || 0);
  const max = Math.max(1, ...nums);
  const min = Math.min(...nums);

  const pad = 6;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const points = nums
    .map((v, i) => {
      const x = pad + (innerW * (nums.length === 1 ? 0 : i / (nums.length - 1)));
      const t = max === min ? 0.5 : (v - min) / (max - min);
      const y = pad + (1 - t) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Box sx={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />

        {nums.map((v, i) => {
          const x = pad + (innerW * (nums.length === 1 ? 0 : i / (nums.length - 1)));
          const t = max === min ? 0.5 : (v - min) / (max - min);
          const y = pad + (1 - t) * innerH;
          return <circle key={i} cx={x} cy={y} r="3.5" fill="currentColor" />;
        })}
      </svg>
    </Box>
  );
}
