import { fmtNum, fmtDate, fmtDelta } from "../src/lib/format";
import ScoreTrend from "./report/ScoreTrend";

function Delta({ value }) {
  if (typeof value !== "number" || value === 0) {
    return <span className="text-faint">±0</span>;
  }
  const positive = value > 0;
  return (
    <span className={positive ? "text-ink font-medium" : "text-muted"}>
      {fmtDelta(value)}
    </span>
  );
}

const HistoryPanel = ({ snapshots }) => {
  if (!snapshots || snapshots.length === 0) return null;

  if (snapshots.length < 2) {
    return (
      <p className="text-muted text-sm">
        Analyze a profile once more to start comparing progress over time.
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 anim-fade-in">
      <ScoreTrend snapshots={snapshots} />

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm border border-line">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Profile</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-3 py-2 font-medium">Δ Score</th>
              <th className="px-3 py-2 font-medium">Repos</th>
              <th className="px-3 py-2 font-medium">Stars</th>
              <th className="px-3 py-2 font-medium">Commits 30d</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s, i) => {
              const prev = i > 0 ? snapshots[i - 1] : null;
              return (
                <tr key={s.at} className="border-b border-line-2 last:border-b-0">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(s.at)}</td>
                  <td className="px-3 py-2 font-medium">{s.username}</td>
                  <td className="px-3 py-2 tabular-nums">{s.score ?? "–"}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <Delta
                      value={prev ? (s.score ?? 0) - (prev.score ?? 0) : undefined}
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(s.repos)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(s.stars)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {typeof s.commits30 === "number" ? fmtNum(s.commits30) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPanel;