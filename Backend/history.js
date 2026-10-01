import { Snapshot } from "./models/Snapshot.js";

const MAX_SNAPSHOTS = 20;

/**
 * Append an analysis snapshot for a signed-in user.
 * `user` is the decoded JWT ({ login, githubId, ... }).
 * Keeps only the newest MAX_SNAPSHOTS per user.
 */
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

/**
 * Delete every snapshot for a signed-in user.
 * Returns the number of removed rows.
 */
export async function clearHistory(user) {
  const result = await Snapshot.deleteMany({ login: user.login });
  return result.deletedCount || 0;
}

/**
 * Get history for a signed-in user, oldest first (the frontend computes
 * deltas against the previous row).
 */
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
    skills: d.skills || [],
  }));
}
