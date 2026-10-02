import { Snapshot } from "./models/Snapshot.js";

const MAX_SNAPSHOTS = 20;

export async function appendSnapshot(user, snapshot) {
  await Snapshot.create({
    githubId: user.githubId,
    login: user.login,
    ...snapshot,
  });

  const overflow = await Snapshot.find({ login: user.login })
    .sort({ createdAt: -1 })
    .skip(MAX_SNAPSHOTS)
    .select("_id");

  if (overflow.length > 0) {
    await Snapshot.deleteMany({ _id: { $in: overflow.map((d) => d._id) } });
  }
}

export async function clearHistory(user) {
  const result = await Snapshot.deleteMany({ login: user.login });
  return result.deletedCount || 0;
}

export async function getHistory(user) {
  const docs = await Snapshot.find({ login: user.login })
    .sort({ createdAt: -1 })
    .limit(MAX_SNAPSHOTS)
    .lean();

  return docs.reverse().map((d) => ({
    at: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    username: d.username,
    score: d.score,
    repos: d.repos,
    followers: d.followers,
    stars: d.stars,
    forks: d.forks,
    activeRepos: d.activeRepos,
    commits30: d.commits30 ?? null,
    longestStreak: d.longestStreak ?? null,
    hygieneScore: d.hygieneScore ?? null,
    skills: d.skills || [],
  }));
}
