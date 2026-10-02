import { fmtNum } from "../../src/lib/format";

const StatsStrip = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: "Repos", value: fmtNum(stats.repos) },
    { label: "Followers", value: fmtNum(stats.followers) },
    { label: "Stars", value: fmtNum(stats.stars) },
    { label: "Forks", value: fmtNum(stats.forks) },
    { label: "Active", value: fmtNum(stats.activeRepos) },
    { label: "Yrs", value: stats.accountAgeYears },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-line border border-line">
      {items.map((s) => (
        <div key={s.label} className="bg-surface p-3 text-center">
          <p className="font-bold text-xl tabular-nums">{s.value}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsStrip;
