import { fmtNum } from "../../src/lib/format";
import { Panel } from "./Panel";

const TopRepos = ({ repos = [] }) => {
  if (repos.length === 0) return null;

  return (
    <Panel title="Top Repositories">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {repos.map((r) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group border border-line px-3 py-2 flex items-center
              justify-between gap-2 hover:border-ink press"
          >
            <span className="truncate font-medium text-sm">{r.name}</span>
            <span className="text-muted text-xs whitespace-nowrap">
              ★ {fmtNum(r.stars)}
              {r.language ? ` · ${r.language}` : ""}
            </span>
          </a>
        ))}
      </div>
    </Panel>
  );
};

export default TopRepos;
