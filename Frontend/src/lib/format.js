export function fmtNum(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function fmtDelta(n) {
  if (typeof n !== "number" || !Number.isFinite(n) || n === 0) return "±0";
  return n > 0 ? `+${fmtNum(n)}` : fmtNum(n);
}

export function fmtDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
