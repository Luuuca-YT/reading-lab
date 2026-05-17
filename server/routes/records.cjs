const express = require('express');
const db = require('../db.cjs');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

// Audio upload/download
const AUDIO_DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'), 'audio');
fs.mkdirSync(AUDIO_DIR, { recursive: true });

// POST /api/records/:id/audio — upload audio blob
router.post('/:id/audio', express.raw({ type: 'audio/*', limit: '100mb' }), (req, res) => {
  const record = db.prepare('SELECT * FROM reading_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  const ext = req.headers['content-type']?.includes('opus') ? 'webm' : 'webm';
  const filename = `record-${req.params.id}.${ext}`;
  fs.writeFileSync(path.join(AUDIO_DIR, filename), req.body);

  db.prepare('UPDATE reading_records SET audio_path = ? WHERE id = ?').run(filename, req.params.id);
  res.json({ audio_path: filename });
});

// GET /api/records/:id/audio — download audio file
router.get('/:id/audio', (req, res) => {
  const record = db.prepare('SELECT * FROM reading_records WHERE id = ?').get(req.params.id);
  if (!record || !record.audio_path) return res.status(404).json({ error: 'Audio not found' });

  const filePath = path.join(AUDIO_DIR, record.audio_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Audio file missing' });

  res.setHeader('Content-Type', 'audio/webm');
  res.setHeader('Content-Disposition', `attachment; filename="reading-${record.id}.webm"`);
  res.sendFile(filePath);
});

// Reading records
router.get('/session/:sessionId', (req, res) => {
  const list = db.prepare(
    `SELECT rr.*, a.title AS article_title
     FROM reading_records rr
     JOIN articles a ON a.id = rr.article_id
     WHERE rr.session_id = ?
     ORDER BY rr.created_at`
  ).all(req.params.sessionId);
  res.json(list);
});

router.post('/', (req, res) => {
  const { session_id, article_id, audio_path, start_time, end_time } = req.body;
  const result = db.prepare(
    'INSERT INTO reading_records (session_id, article_id, audio_path, start_time, end_time) VALUES (?, ?, ?, ?, ?)'
  ).run(session_id, article_id, audio_path || null, start_time || null, end_time || null);
  res.status(201).json(
    db.prepare('SELECT * FROM reading_records WHERE id = ?').get(result.lastInsertRowid)
  );
});

// Reading events
router.get('/:recordId/events', (req, res) => {
  const list = db.prepare(
    'SELECT * FROM reading_events WHERE reading_record_id = ? ORDER BY timestamp_ms'
  ).all(req.params.recordId);
  res.json(list);
});

router.post('/:recordId/events', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) return res.status(400).json({ error: 'events array required' });
  const stmt = db.prepare(
    'INSERT INTO reading_events (reading_record_id, word, timestamp_ms, event_type) VALUES (?, ?, ?, ?)'
  );
  db.transaction(() => {
    for (const e of events) {
      stmt.run(req.params.recordId, e.word, e.timestamp_ms, e.event_type);
    }
  })();
  res.status(201).json({ count: events.length });
});

// Feedback
router.get('/:recordId/student-feedback', (req, res) => {
  const fb = db.prepare('SELECT * FROM student_feedback WHERE reading_record_id = ?').get(req.params.recordId);
  res.json(fb || null);
});

router.post('/:recordId/student-feedback', (req, res) => {
  const { q1_understand, q2_difficulty, q3_interest, q4_effort } = req.body;
  const result = db.prepare(
    'INSERT INTO student_feedback (reading_record_id, q1_understand, q2_difficulty, q3_interest, q4_effort) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.recordId, q1_understand, q2_difficulty, q3_interest, q4_effort);
  res.status(201).json(
    db.prepare('SELECT * FROM student_feedback WHERE id = ?').get(result.lastInsertRowid)
  );
});

router.get('/:recordId/tutor-feedback', (req, res) => {
  const fb = db.prepare('SELECT * FROM tutor_feedback WHERE reading_record_id = ?').get(req.params.recordId);
  res.json(fb || null);
});

router.post('/:recordId/tutor-feedback', (req, res) => {
  const { q1_accuracy, q2_fluency, q3_comprehension, q4_notes } = req.body;
  const result = db.prepare(
    'INSERT INTO tutor_feedback (reading_record_id, q1_accuracy, q2_fluency, q3_comprehension, q4_notes) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.recordId, q1_accuracy, q2_fluency, q3_comprehension, q4_notes);
  res.status(201).json(
    db.prepare('SELECT * FROM tutor_feedback WHERE id = ?').get(result.lastInsertRowid)
  );
});

module.exports = router;
