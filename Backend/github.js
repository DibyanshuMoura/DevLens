const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

export function clearGitHubCache() {
  cache.clear();
}

async function githubFetch(url) {
  const resp = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (resp.ok) return resp;

  const remaining = resp.headers.get("x-ratelimit-remaining");
  if (resp.status === 403 && remaining === "0") {
    const err = new Error(
      "GitHub rate limit reached — please wait a few minutes and try again.",
    );
    err.status = 429;
    throw err;
  }
  if (resp.status === 404) {
    const err = new Error("GitHub user not found");
    err.status = 404;
    throw err;
  }
  const err = new Error(`GitHub request failed (${resp.status})`);
  err.status = 502;
  throw err;
}

export async function fetchGitHubData(username) {
  const key = username.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const user = await (
    await githubFetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
    )
  ).json();

  const repos = await (await githubFetch(user.repos_url)).json();

  let stars = 0,
    forks = 0,
    active = 0;
  const langs = {};

  const ranked = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );

  repos.forEach((r) => {
    stars += r.stargazers_count;
    forks += r.forks_count;
    if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
    if (Date.now() - new Date(r.updated_at) < 30 * 86400000) active++;
  });

  const accountAgeYears = Number(
    ((Date.now() - new Date(user.created_at)) / (365.25 * 86400000)).toFixed(1),
  );

  const topReposFull = ranked.slice(0, 8).map((r) => ({
    name: r.name,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    description: r.description,
    topics: (r.topics || []).slice(0, 6),
    url: r.html_url,
    updatedAt: r.updated_at,
  }));

  const userData = {
    username: user.login,
    name: user.name,
    bio: user.bio,
    repos: user.public_repos,
    followers: user.followers,
    stars,
    forks,
    accountAgeYears,
    languages: Object.keys(langs).slice(0, 3),
    languageCounts: Object.fromEntries(
      Object.entries(langs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    ),
    activeRepos: active,
    topRepos: topReposFull,
  };

  const result = {
    user,
    repos,
    ranked,
    stars,
    forks,
    active,
    accountAgeYears,
    languages: userData.languages,
    topReposFull,
    userData,
  };
  cacheSet(key, result);
  return result;
}
