// Shared GitHub fetch + stat computation.
// Used by /analyze (profile scoring) so every request sees the same data.

/**
 * Fetch a GitHub profile with its public repositories and precompute the
 * stats used across the app.
 * Throws an Error with `status` set (404) when the user does not exist.
 */
export async function fetchGitHubData(username) {
  const resp = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
  );
  if (!resp.ok) {
    const err = new Error("GitHub user not found");
    err.status = 404;
    throw err;
  }
  const user = await resp.json();

  const reposRes = await fetch(user.repos_url);
  if (!reposRes.ok) {
    throw new Error("Failed to fetch repositories");
  }
  const repos = await reposRes.json();

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

  // Top repositories with descriptions/topics — the raw material the LLM
  // turns into resume project entries.
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
    // Full frequency map — lets the LLM build honest, evidence-based
    // skill groups instead of guessing.
    languageCounts: Object.fromEntries(
      Object.entries(langs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    ),
    activeRepos: active,
    topRepos: topReposFull,
  };

  return {
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
}
