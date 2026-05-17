const express = require('express');
const db = require('../db.cjs');
const { hashPassword, verifyPassword, createToken, authMiddleware } = require('../auth.cjs');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken(admin);
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.display_name,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — verify token and return current admin
router.get('/me', authMiddleware, (req, res) => {
  const admin = db.prepare('SELECT id, username, display_name, role FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  res.json(admin);
});

// POST /api/auth/register — admin creates new tutor account
router.post('/register', authMiddleware, (req, res) => {
  const adminUser = db.prepare('SELECT role FROM admins WHERE id = ?').get(req.admin.id);
  if (adminUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create accounts' });
  }

  const { username, password, displayName, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  db.prepare('INSERT INTO admins (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)').run(
    username,
    hashPassword(password),
    displayName || username,
    role || 'tutor'
  );

  res.status(201).json({ username, displayName, role });
});

// GET /api/auth/accounts — list all admin/tutor accounts
router.get('/accounts', authMiddleware, (req, res) => {
  const accounts = db.prepare('SELECT id, username, display_name, role, created_at FROM admins ORDER BY created_at').all();
  res.json(accounts);
});

// DELETE /api/auth/accounts/:id
router.delete('/accounts/:id', authMiddleware, (req, res) => {
  const adminUser = db.prepare('SELECT role FROM admins WHERE id = ?').get(req.admin.id);
  if (adminUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete accounts' });
  }
  if (Number(req.params.id) === req.admin.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
