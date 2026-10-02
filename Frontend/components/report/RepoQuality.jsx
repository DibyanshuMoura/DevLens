import { fmtNum } from "../../src/lib/format";
import { Panel, ScoreMeter } from "./Panel";

const RepoRow = ({ repo }) => (
  <div className="border border-line p-3 lift">
    <div className="flex items-start justify-between gap-2">
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sm hover:underline truncate min-w-0"
      >
        {repo.name}
      </a>
      <span className="text-muted text-xs whitespace-nowrap shrink-0">
        {repo.stars > 0 ? `★ ${fmtNum(repo.stars)}` : "—"}
        {repo.language ? ` · ${repo.language}` : ""}
      </span>
    </div>

    <div className="flex items-center gap-2 mt-2">
      <div className="h-1.5 flex-1 bg-line overflow-hidden">
        <div className="score-bar-fill" style={{ width: `${repo.score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted shrink-0">
        {repo.score}/100
      </span>
    </div>

    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
      {repo.checks.map((c) => (
        <li key={c.key} className="flex items-center gap-1.5 text-xs min-w-0">
          <span
            aria-hidden="true"
            className={c.ok ? "text-ink" : "text-faint"}
          >
            {c.ok ? "✓" : "✕"}
          </span>
          <span
            className={`truncate ${c.ok ? "text-muted" : ""}`}
            title={c.label}
          >
            {c.label}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const RepoQuality = ({ quality }) => {
  if (!quality?.repos?.length) return null;

  return (
    <Panel
      title="Repository Quality"
      description={`Deterministic checks across your ${quality.scored} highest-ranked repositories — no guessing.`}
      actions={<ScoreMeter value={quality.score} />}
    >
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 anim-stagger">
        {quality.checks.map((c) => (
          <div key={c.key} className="border border-line p-3 lift">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm">{c.label}</p>
              <p className="text-xs text-muted tabular-nums shrink-0">
                {c.passed}/{c.total}
              </p>
            </div>
            <div className="h-1.5 mt-2 bg-line overflow-hidden">
              <div className="score-bar-fill" style={{ width: `${c.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {quality.highlights?.length > 0 && (
        <ul className="list-disc pl-5 wrap-break-word text-sm text-muted space-y-1.5 mt-4">
          {quality.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}

      <h4 className="font-medium text-sm mt-5 mb-2">Per repository</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 anim-stagger">
        {quality.repos.map((repo) => (
          <RepoRow key={repo.name} repo={repo} />
        ))}
      </div>
    </Panel>
  );
};

export default RepoQuality;
