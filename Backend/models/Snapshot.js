import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema({
  githubId: { type: Number, index: true },
  login: { type: String, required: true, index: true },
  // GitHub profile that was analyzed (may differ from the signed-in user)
  username: { type: String, required: true },
  score: Number,
  repos: Number,
  followers: Number,
  stars: Number,
  forks: Number,
  activeRepos: Number,
  skills: [String],
  createdAt: { type: Date, default: Date.now },
});

// Per-user history, newest first
snapshotSchema.index({ login: 1, createdAt: -1 });

export const Snapshot = mongoose.model("Snapshot", snapshotSchema);
