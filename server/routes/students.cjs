const express = require('express');
const db = require('../db.cjs');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

const AUDIO_DIR = path.join(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'), 'audio');

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

// GET /api/students/:id/recordings — list all recordings with audio for a student
router.get('/:id/recordings', (req, res) => {
  const recordings = db.prepare(`
    SELECT rr.id, rr.audio_path, rr.created_at, a.title AS article_title, s.day_number, s.date
    FROM reading_records rr
    JOIN sessions s ON s.id = rr.session_id
    JOIN articles a ON a.id = rr.article_id
    WHERE s.student_id = ?
      AND rr.audio_path IS NOT NULL
    ORDER BY rr.created_at DESC
  `).all(req.params.id);
  res.json(recordings);
});

// GET /api/students/:id/recordings/zip — download all recordings as a zip file
router.get('/:id/recordings/zip', (req, res) => {
  const recordings = db.prepare(`
    SELECT rr.id, rr.audio_path, a.title, s.day_number
    FROM reading_records rr
    JOIN sessions s ON s.id = rr.session_id
    JOIN articles a ON a.id = rr.article_id
    WHERE s.student_id = ?
      AND rr.audio_path IS NOT NULL
    ORDER BY s.day_number
  `).all(req.params.id);

  if (recordings.length === 0) {
    return res.status(404).json({ error: 'No recordings found for this student' });
  }

  const student = db.prepare('SELECT name FROM students WHERE id = ?').get(req.params.id);
  const safeName = (student?.name || `student-${req.params.id}`).replace(/[^a-zA-Z0-9一-鿿_-]/g, '_');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}-recordings.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => {
    console.error('[zip]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Zip failed' });
  });

  archive.pipe(res);

  for (const rec of recordings) {
    const filePath = path.join(AUDIO_DIR, rec.audio_path);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(rec.audio_path) || '.webm';
      const entryName = `Day${rec.day_number}-${rec.title.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_')}${ext}`;
      archive.file(filePath, { name: entryName });
    }
  }

  archive.finalize();
});

module.exports = router;
