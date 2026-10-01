import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  githubId: { type: Number, required: true, unique: true },
  login: { type: String, required: true, index: true },
  avatar: String,
  profile: String,
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
