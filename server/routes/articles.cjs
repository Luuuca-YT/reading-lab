const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('../auth.cjs');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (_req, res) => {
  res.json(db.prepare('SELECT * FROM articles ORDER BY sort_order').all());
});

router.get('/:id', (req, res) => {
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json(a);
});

router.post('/', (req, res) => {
  const { title, content, difficulty, story_group, sort_order } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const result = db.prepare(
    'INSERT INTO articles (title, content, difficulty, story_group, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(title, content, difficulty || 1, story_group || null, sort_order || 0);
  res.status(201).json(
    db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid)
  );
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { title, content, difficulty, story_group, sort_order } = req.body;
  db.prepare(
    'UPDATE articles SET title=?, content=?, difficulty=?, story_group=?, sort_order=? WHERE id=?'
  ).run(
    title ?? existing.title,
    content ?? existing.content,
    difficulty ?? existing.difficulty,
    story_group ?? existing.story_group,
    sort_order ?? existing.sort_order,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
