const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  const list = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
  res.json(list);
});

router.get('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

router.post('/', (req, res) => {
  const { name, age, grade, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare(
    'INSERT INTO students (name, age, grade, notes, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(name, age || null, grade || null, notes || null, req.admin.id);
  const s = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(s);
});

router.put('/:id', (req, res) => {
  const { name, age, grade, notes } = req.body;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE students SET name=?, age=?, grade=?, notes=? WHERE id=?').run(
    name ?? existing.name,
    age ?? existing.age,
    grade ?? existing.grade,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (_req, res) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
