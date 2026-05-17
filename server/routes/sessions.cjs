const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  const list = db.prepare('SELECT * FROM sessions WHERE student_id = ? ORDER BY date DESC').all(req.params.studentId);
  res.json(list);
});

router.get('/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

router.post('/', (req, res) => {
  const { student_id, tutor_id, day_number, date, notes } = req.body;
  if (!student_id || !tutor_id || !day_number) {
    return res.status(400).json({ error: 'student_id, tutor_id, and day_number are required' });
  }
  const result = db.prepare(
    'INSERT INTO sessions (student_id, tutor_id, day_number, date, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(student_id, tutor_id, day_number, date || new Date().toISOString().slice(0, 10), notes || null);
  res.status(201).json(
    db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid)
  );
});

router.get('/day-number/:studentId', (req, res) => {
  const row = db.prepare(
    'SELECT COALESCE(MAX(day_number), 0) + 1 AS next_day FROM sessions WHERE student_id = ?'
  ).get(req.params.studentId);
  res.json({ dayNumber: row.next_day });
});

// Daily confidence (before/after intervention)
router.post('/:id/confidence', (req, res) => {
  const { phase, confidence } = req.body;
  if (!['before', 'after'].includes(phase)) {
    return res.status(400).json({ error: 'phase must be "before" or "after"' });
  }
  if (!confidence) return res.status(400).json({ error: 'confidence required' });
  db.prepare(
    `INSERT INTO daily_confidence (session_id, phase, confidence) VALUES (?, ?, ?)
     ON CONFLICT(session_id, phase) DO UPDATE SET confidence=excluded.confidence`
  ).run(req.params.id, phase, confidence);
  res.json({ success: true });
});

router.get('/:id/confidence', (req, res) => {
  const rows = db.prepare(
    'SELECT phase, confidence, created_at FROM daily_confidence WHERE session_id = ?'
  ).all(req.params.id);
  res.json(rows);
});

module.exports = router;
