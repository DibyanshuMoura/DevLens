const W = 600;
const H = 120;
const PAD = { top: 10, right: 8, bottom: 18, left: 8 };

function plot(snapshots, series) {
  const n = snapshots.length;
  if (n === 0) return null;

  const x = (i) =>
    n === 1
      ? (W + PAD.left + PAD.right) / 2
      : PAD.left + (i * (W - PAD.left - PAD.right)) / (n - 1);

  return series.map((s) => {
    const [min, max] = s.domain || [
      0,
      Math.max(
        ...snapshots
          .map((snap) => snap[s.key])
          .filter((v) => typeof v === "number" && Number.isFinite(v)),
        1,
      ),
    ];
    const span = max - min || 1;
    const y = (v) => H - PAD.bottom - ((v - min) / span) * (H - PAD.top - PAD.bottom);

    const points = snapshots
      .map((snap, i) => ({ i, v: snap[s.key] }))
      .filter(({ v }) => typeof v === "number" && Number.isFinite(v));
    if (points.length < 2) return null;

    const path = points
      .map(({ i, v }, idx) => `${idx === 0 ? "M" : "L"}${x(i)},${y(v)}`)
      .join(" ");

    return (
      <g key={s.key}>
        <path
          d={path}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={s.className}
        />
        {points.map(({ i, v }) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r="2"
            className={s.className}
          />
        ))}
      </g>
    );
  });
}

const SERIES = [
  { key: "score", label: "Score", className: "stroke-ink fill-ink", domain: [0, 100] },
  { key: "commits30", label: "Commits · 30d", className: "stroke-muted fill-muted" },
  { key: "hygieneScore", label: "Repo quality", className: "stroke-faint fill-faint", domain: [0, 100] },
];

const ScoreTrend = ({ snapshots = [] }) => {
  if (snapshots.length < 2) return null;

  const available = SERIES.filter((s) =>
    snapshots.some(
      (snap) => typeof snap[s.key] === "number" && Number.isFinite(snap[s.key]),
    ),
  );
  if (available.length === 0) return null;

  const last = snapshots[snapshots.length - 1];
  const first = snapshots[0];

  return (
    <div className="w-full anim-fade-in">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto border border-line anim-rise"
        role="img"
        aria-label="Trend of score, commit volume and repo quality over time"
      >
        {plot(snapshots, available)}
      </svg>

      <div className="flex items-center justify-between gap-3 flex-wrap mt-2">
        <div className="flex items-center gap-3 flex-wrap">
          {available.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                aria-hidden="true"
                className={`w-3 h-[2px] ${
                  s.key === "score"
                    ? "bg-ink"
                    : s.key === "commits30"
                      ? "bg-muted"
                      : "bg-faint"
                }`}
              />
              {s.label}
              {typeof last[s.key] === "number" &&
                Number.isFinite(last[s.key]) &&
                ` · ${last[s.key]}`}
            </span>
          ))}
        </div>
        <span className="text-xs text-muted">
          {snapshots.length} runs
          {typeof last.score === "number" &&
            Number.isFinite(last.score) &&
            typeof first.score === "number" &&
            Number.isFinite(first.score) &&
            ` · score ${last.score >= first.score ? "+" : ""}${last.score - first.score}`}
        </span>
      </div>
    </div>
  );
};

export default ScoreTrend;
