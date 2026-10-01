/** Short number formatting: 1234 -> "1.2k", 2500000 -> "2.5m". */
export function fmtNum(n) {
  if (typeof n !== "number") return "–";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

/** signed delta like "+120" / "-45" / "±0". */
export function fmtDelta(n) {
  if (typeof n !== "number" || n === 0) return "±0";
  return n > 0 ? `+${fmtNum(n)}` : fmtNum(n);
}

/** ISO date -> "Mar 12, 2026". */
export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
