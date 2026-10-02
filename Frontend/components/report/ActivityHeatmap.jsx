import { fmtNum, fmtDate } from "../../src/lib/format";
import { Panel } from "./Panel";

const LEVELS = ["bg-transparent", "bg-ink/15", "bg-ink/35", "bg-ink/60", "bg-ink"];
const CELL = "flex-1 min-w-0 aspect-square border border-line";
const GAP = "gap-[2px]";
const GUTTER = "w-7 shrink-0";
const MIN_W = "min-w-[620px]";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function level(count, max) {
  if (!count) return 0;
  if (max <= 1) return 4;
  return Math.min(4, Math.ceil((count / max) * 4));
}

function bucketWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function indexByWeekday(weeks) {
  return weeks.map((week) => {
    const slots = new Array(7).fill(null);
    for (const day of week) {
      const at = new Date(`${day.date}T00:00:00.000Z`).getUTCDay();
      slots[at] = day;
    }
    return slots;
  });
}

function monthLabelName(mm) {
  const d = new Date(`2000-${mm}-01T00:00:00.000Z`);
  return d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
}

function monthLabels(columns, year) {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  let prev = null;
  return columns.map((slots) => {
    const inYear = slots.filter(
      (d) => d && d.date >= from && d.date <= to,
    );
    const month = inYear.length ? inYear[0].date.slice(5, 7) : null;
    const label = month && month !== prev ? monthLabelName(month) : "";
    prev = month ?? prev;
    return label;
  });
}

const Stat = ({ label, value }) => (
  <div className="border border-line px-3 py-2 min-w-0">
    <p className="font-bold text-lg tabular-nums truncate">{value}</p>
    <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
      {label}
    </p>
  </div>
);

const ActivityHeatmap = ({ activity, title, className = "" }) => {
  if (!activity?.days?.length) return null;

  const columns = indexByWeekday(bucketWeeks(activity.days));
  const max = activity.days.reduce((m, d) => Math.max(m, d.count), 0);
  const year = activity.year ?? new Date().getFullYear();
  const labels = monthLabels(columns, year);

  const stats = [
    [`Commits · ${year}`, fmtNum(activity.totalCommits)],
    ["Commits · 30d", fmtNum(activity.commits30)],
    ["Active days", fmtNum(activity.activeDays)],
    ["Current streak", `${activity.currentStreak}d`],
    ["Longest streak", `${activity.longestStreak}d`],
  ];

  return (
    <Panel
      title={title || "Commit Activity"}
      description={
        activity.reposScanned
          ? `Public commits you authored across your ${activity.reposScanned} most recently pushed repositories, January to December ${year}. Private work is never visible to GitHub's API.${activity.truncated ? " Partial — GitHub's rate limit was reached partway through." : ""}`
          : "Public pushes only — private work and full history are never exposed by GitHub."
      }
      className={className}
    >
      {}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 anim-stagger">
        {stats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>

      {
}
      <div className="mt-5 overflow-x-auto pb-1 anim-fade-in scroll-x-smooth">
        <div className={`w-full ${MIN_W} anim-scale-in`}>
          <div className={`flex ${GAP} mb-1`}>
            <span className={GUTTER} />
            {labels.map((label, i) => (
              <span
                key={i}
                className="flex-1 min-w-0 text-[9px] leading-none text-muted
                  truncate"
              >
                {label}
              </span>
            ))}
          </div>

          <div className={`flex flex-col ${GAP}`}>
            {WEEKDAY_LABELS.map((label, row) => {
              const weekday = (row + 1) % 7;
              return (
                <div key={label} className="flex items-center">
                  <span
                    className={`${GUTTER} text-[9px] text-muted pr-1 text-right
                      flex items-center justify-end`}
                  >
                    {label}
                  </span>
                  {columns.map((slots, w) => {
                    const day = slots[weekday];
                    return (
                      <span
                        key={w}
                        className={`${CELL} ${LEVELS[day ? level(day.count, max) : 0]}`}
                        title={
                          day
                            ? `${day.count} commit${day.count === 1 ? "" : "s"} · ${fmtDate(day.date)}`
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-4 text-[10px] text-muted">
        <span className="sm:hidden">Swipe the grid sideways to see the full year</span>
        <span>
          {activity.busiestWeekday
            ? `Most active on ${activity.busiestWeekday}`
            : "No recent activity"}
          {activity.busiestDay &&
            ` · peak ${activity.busiestDay.count} commits on ${fmtDate(activity.busiestDay.date)}`}
        </span>
        <span className="flex items-center gap-1">
          Less
          {LEVELS.map((cls, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 border border-line shrink-0 ${cls}`}
            />
          ))}
          More
        </span>
      </div>
    </Panel>
  );
};

export default ActivityHeatmap;
