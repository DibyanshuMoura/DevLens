import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing from Backend/.env");
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected — waiting for reconnect...");
  });

  await mongoose.connect(uri, { dbName: "devlens" });
  console.log(`MongoDB connected → ${mongoose.connection.name}`);
}
