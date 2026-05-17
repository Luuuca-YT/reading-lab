const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const list = db.prepare('SELECT * FROM tutors ORDER BY created_at DESC').all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare(
    'INSERT INTO tutors (name, email) VALUES (?, ?)'
  ).run(name, email || null);
  const t = db.prepare('SELECT * FROM tutors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(t);
});

router.put('/:id', (req, res) => {
  const { name, email } = req.body;
  const existing = db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE tutors SET name=?, email=? WHERE id=?').run(
    name ?? existing.name,
    email ?? existing.email,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM tutors WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (_req, res) => {
  db.prepare('DELETE FROM tutors WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
