const MAX_REPOS = 8;
const MAX_PAGES_PER_REPO = 3;
const PER_PAGE = 100;
const CONCURRENCY = 3;
const ACTIVE_WINDOW_MS = 30 * 86400000;

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

export function clearActivityCache() {
  cache.clear();
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function pickRepos(repos) {
  return repos
    .filter((r) => !r.fork && r.full_name)
    .sort(
      (a, b) =>
        new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0) ||
        (b.stargazers_count || 0) - (a.stargazers_count || 0),
    )
    .slice(0, MAX_REPOS);
}

class RateLimitedError extends Error {
  constructor() {
    super("GitHub rate limit reached");
    this.name = "RateLimitedError";
  }
}

function isRateLimited(resp) {
  return (
    (resp.status === 403 || resp.status === 429) &&
    resp.headers?.get?.("x-ratelimit-remaining") === "0"
  );
}

async function collectRepoCommits(fullName, login, since, into) {
  for (let page = 1; page <= MAX_PAGES_PER_REPO; page++) {
    const url = new URL(
      `https://api.github.com/repos/${fullName}/commits`,
    );
    url.searchParams.set("author", login);
    url.searchParams.set("since", since);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const resp = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (isRateLimited(resp)) throw new RateLimitedError();
    if (!resp.ok) return;

    const commits = await resp.json();
    if (!Array.isArray(commits) || commits.length === 0) return;

    for (const commit of commits) {
      const at = commit?.commit?.author?.date;
      if (!at) continue;
      const key = dayKey(new Date(at));
      into.set(key, (into.get(key) || 0) + 1);
    }

    if (commits.length < PER_PAGE) return;
  }
}

async function pooledMap(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        await worker(item);
      } catch (err) {
        if (err instanceof RateLimitedError) throw err;
        console.error(`Commit activity: ${item} failed —`, err.message);
      }
    }
  });
  await Promise.all(runners);
}

function computeStreaks(counts, firstDay, todayKey) {
  let longest = 0;
  let run = 0;
  const cursor = new Date(firstDay);
  while (dayKey(cursor) <= todayKey) {
    run = (counts.get(dayKey(cursor)) || 0) > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let current = 0;
  const back = new Date(`${todayKey}T00:00:00.000Z`);
  if ((counts.get(todayKey) || 0) === 0) back.setUTCDate(back.getUTCDate() - 1);
  while ((counts.get(dayKey(back)) || 0) > 0) {
    current++;
    back.setUTCDate(back.getUTCDate() - 1);
  }
  return { longest, current };
}

export async function fetchCommitActivity(login, repos = []) {
  const cacheKey = `${String(login).toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  try {
    const targets = pickRepos(repos);
    if (targets.length === 0) return null;

    const now = new Date();
    const todayKey = dayKey(now);
    const year = now.getUTCFullYear();
    const firstOfYear = new Date(Date.UTC(year, 0, 1));
    const lastOfYear = new Date(Date.UTC(year, 11, 31));
    const endKey = dayKey(lastOfYear);
    const since = firstOfYear.toISOString();

    const start = new Date(firstOfYear);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const firstDay = dayKey(start);

    const counts = new Map();
    let truncated = false;
    try {
      await pooledMap(targets, CONCURRENCY, (repo) =>
        collectRepoCommits(repo.full_name, login, since, counts),
      );
    } catch (err) {
      if (!(err instanceof RateLimitedError)) throw err;
      truncated = true;
      console.error(
        "Commit activity: GitHub rate limit reached — showing partial results.",
      );
    }

    const days = [];
    const weekCounts = [0];
    const weekdayTotals = new Array(7).fill(0);
    let totalCommits = 0;
    let commits30 = 0;
    let activeDays = 0;
    let busiestDay = null;
    let week = 0;

    const cursor = new Date(start);
    let lastKey = firstDay;
    while (lastKey <= endKey) {
      const key = dayKey(cursor);
      const count = counts.get(key) || 0;
      totalCommits += count;
      if (count > 0) {
        activeDays++;
        weekdayTotals[cursor.getUTCDay()] += count;
        if (!busiestDay || count > busiestDay.count) {
          busiestDay = { date: key, count };
        }
      }
      if (Date.now() - cursor.getTime() <= ACTIVE_WINDOW_MS) commits30 += count;
      days.push({ date: key, count });

      weekCounts[week] += count;
      if (cursor.getUTCDay() === 6) week++;

      lastKey = key;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const { longest, current } = computeStreaks(counts, firstDay, todayKey);
    const topWeekday = weekdayTotals.indexOf(Math.max(...weekdayTotals));

    const result = {
      days,
      totalCommits,
      commits30,
      activeDays,
      currentStreak: current,
      longestStreak: longest,
      busiestDay,
      busiestWeekday: activeDays > 0 ? WEEKDAYS[topWeekday] : null,
      weekCounts,
      year,
      reposScanned: targets.length,
      truncated,
    };
    cache.set(cacheKey, { at: Date.now(), value: result });
    return result;
  } catch (err) {
    console.error("Commit activity failed:", err.message);
    return null;
  }
}

export function activityDigest(activity) {
  if (!activity) return null;
  return {
    year: activity.year,
    publicCommitsThisYear: activity.totalCommits,
    publicCommitsLast30Days: activity.commits30,
    activeDaysThisYear: activity.activeDays,
    currentStreakDays: activity.currentStreak,
    longestStreakDays: activity.longestStreak,
    mostActiveWeekday: activity.busiestWeekday,
    busiestDay: activity.busiestDay,
    reposScanned: activity.reposScanned,
  };
}
