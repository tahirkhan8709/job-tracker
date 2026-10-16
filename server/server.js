require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Fail fast if required env vars are missing
['MONGO_URI', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
      const isDevLocalhost =
        process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin || '');
      // no origin = tools like Thunder Client; otherwise must be listed or a dev localhost port
      if (!origin || allowed.includes(origin) || isDevLocalhost) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start a listening server when run directly (npm run dev / npm start).
// On Vercel the app is imported by api/index.js instead.
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = app;
