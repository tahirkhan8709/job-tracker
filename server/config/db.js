const mongoose = require('mongoose');

// Reuse one connection between requests (needed for serverless hosting)
const cached = global._mongoCache || (global._mongoCache = { conn: null, promise: null });

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, { bufferCommands: false })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
};

module.exports = connectDB;