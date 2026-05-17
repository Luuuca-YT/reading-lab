require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { ensureAdmin } = require('./auth.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// API routes
app.use('/api/auth', require('./routes/auth.cjs'));
app.use('/api/students', require('./routes/students.cjs'));
app.use('/api/sessions', require('./routes/sessions.cjs'));
app.use('/api/articles', require('./routes/articles.cjs'));
app.use('/api/records', require('./routes/records.cjs'));
app.use('/api/tutors', require('./routes/students.cjs')); // tutors CRUD uses same pattern

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React build in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start
ensureAdmin();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Default login: admin / admin123`);
});
