const STALE_AFTER_DAYS = 180;

const CHECKS = [
  {
    key: "description",
    label: "Has a description",
    test: (r) => Boolean(r.description && r.description.trim()),
    weight: 1,
  },
  {
    key: "topics",
    label: "Has topics",
    test: (r) => Array.isArray(r.topics) && r.topics.length > 0,
    weight: 1.5,
  },
  {
    key: "license",
    label: "Has a license",
    test: (r) => Boolean(r.license && r.license.spdx_id !== "NOASSERTION"),
    weight: 1.5,
  },
  {
    key: "fresh",
    label: "Pushed in last 180 days",
    test: (r) =>
      Date.now() - new Date(r.pushed_at || r.updated_at).getTime() <
      STALE_AFTER_DAYS * 86400000,
    weight: 1,
  },
  {
    key: "homepage",
    label: "Has a homepage or demo link",
    test: (r) => Boolean(r.homepage && r.homepage.trim()),
    weight: 0.5,
  },
  {
    key: "tests",
    label: "Looks test-covered",
    test: (r) => /test|spec|__tests__|e2e/i.test(`${r.name} ${r.description || ""}`),
    weight: 0.5,
  },
];

const TOTAL_WEIGHT = CHECKS.reduce((sum, c) => sum + c.weight, 0);

function scoreRepo(repo) {
  const results = CHECKS.map((check) => ({
    key: check.key,
    label: check.label,
    ok: Boolean(check.test(repo)),
    weight: check.weight,
  }));
  const earned = results.reduce((sum, r) => sum + (r.ok ? r.weight : 0), 0);
  return {
    score: Math.round((earned / TOTAL_WEIGHT) * 100),
    checks: results.map(({ key, label, ok }) => ({ key, label, ok })),
  };
}

export function assessRepoQuality(repos, limit = 8) {
  const owned = repos.filter((r) => !r.fork);
  const ranked = [...owned]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0),
    )
    .slice(0, limit);

  if (ranked.length === 0) {
    return { score: 0, checks: [], repos: [], highlights: [], scored: 0 };
  }

  const assessed = ranked.map((r) => {
    const { score, checks } = scoreRepo(r);
    return {
      name: r.name,
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language || null,
      score,
      checks,
      missing: checks.filter((c) => !c.ok).map((c) => c.label),
    };
  });

  const coverage = CHECKS.map((check) => {
    const passed = owned.filter((r) => Boolean(check.test(r))).length;
    return {
      key: check.key,
      label: check.label,
      passed,
      total: owned.length,
      pct: owned.length ? Math.round((passed / owned.length) * 100) : 0,
      weight: check.weight,
    };
  });

  const score = Math.round(
    assessed.reduce((sum, r) => sum + r.score, 0) / assessed.length,
  );

  const highlights = [...coverage]
    .filter((c) => c.pct < 100)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)
    .map(
      (c) =>
        `${c.passed}/${c.total} of your repos pass — ${c.label.toLowerCase()}`,
    );

  return { score, checks: coverage, repos: assessed, highlights, scored: assessed.length };
}

export function qualityDigest(quality) {
  if (!quality || quality.scored === 0) return null;
  return {
    hygieneScore: quality.score,
    reposAssessed: quality.scored,
    weakestSignals: quality.highlights,
  };
}
