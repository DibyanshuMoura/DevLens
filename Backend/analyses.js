import { Analysis } from "./models/Analysis.js";

const MAX_ANALYSES = 5;

async function prune(user) {
  const overflow = await Analysis.find({ login: user.login })
    .sort({ createdAt: -1 })
    .skip(MAX_ANALYSES)
    .select("_id");
  if (overflow.length > 0) {
    await Analysis.deleteMany({ _id: { $in: overflow.map((d) => d._id) } });
  }
}

export async function saveAnalysis(user, payload) {
  await Analysis.create({
    githubId: user.githubId,
    login: user.login,
    username: payload?.name,
    score: payload?.res?.score,
    payload,
  });
  await prune(user);
}

export async function getLatestAnalysis(user) {
  return Analysis.findOne({ login: user.login })
    .sort({ createdAt: -1 })
    .lean();
}

export function isStale(doc, maxAgeMs) {
  if (!doc?.createdAt) return true;
  return Date.now() - new Date(doc.createdAt).getTime() > maxAgeMs;
}

export function toResponse(doc, { cached = false, stale = false } = {}) {
  if (!doc) return null;
  return {
    ...doc.payload,
    role: null,
    cached,
    stale,
    analyzedAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : null,
  };
}

export async function clearAnalyses(user) {
  const result = await Analysis.deleteMany({ login: user.login });
  return result.deletedCount || 0;
}
