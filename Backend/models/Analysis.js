import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  githubId: { type: Number, index: true },
  login: { type: String, required: true, index: true },
  username: String,
  score: Number,
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

analysisSchema.index({ login: 1, createdAt: -1 });

export const Analysis = mongoose.model("Analysis", analysisSchema);
