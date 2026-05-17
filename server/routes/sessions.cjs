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

// DELETE /api/sessions/:id — cascade delete session and all related data + audio files
router.delete('/:id', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const sessionId = req.params.id;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const records = db.prepare('SELECT id, audio_path FROM reading_records WHERE session_id = ?').all(sessionId);
  const recordIds = records.map((r) => r.id);

  const AUDIO_DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'), 'audio');

  db.transaction(() => {
    if (recordIds.length > 0) {
      const placeholders = recordIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM student_feedback WHERE reading_record_id IN (${placeholders})`).run(...recordIds);
      db.prepare(`DELETE FROM tutor_feedback WHERE reading_record_id IN (${placeholders})`).run(...recordIds);
      db.prepare(`DELETE FROM reading_events WHERE reading_record_id IN (${placeholders})`).run(...recordIds);
    }
    db.prepare('DELETE FROM reading_records WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM daily_confidence WHERE session_id = ?').run(sessionId);
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  })();

  // Delete audio files outside the transaction
  for (const rec of records) {
    if (rec.audio_path) {
      const filePath = path.join(AUDIO_DIR, rec.audio_path);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }
  }

  res.json({ success: true, deleted_records: recordIds.length });
});

module.exports = router;
