export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function toInt(value) {
  return Math.round(toNumber(value));
}

export function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

export function formatNumber(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits }).format(n);
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function formatDateLabel(value, lang = "es") {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
