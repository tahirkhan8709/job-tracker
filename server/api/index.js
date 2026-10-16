const connectDB = require('../config/db');
const app = require('../server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    return res.status(500).json({ message: 'Database connection failed' });
  }
  return app(req, res);
};