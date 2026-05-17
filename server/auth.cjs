const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'reading-lab-dev-secret-change-in-production';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function createToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Initialize admin user if none exists
function ensureAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (count === 0) {
    db.prepare('INSERT INTO admins (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)').run(
      'admin',
      hashPassword('admin123'),
      'Administrator',
      'admin'
    );
    console.log('[auth] Default admin created: admin / admin123');
  }
}

module.exports = { hashPassword, verifyPassword, createToken, authMiddleware, ensureAdmin };
