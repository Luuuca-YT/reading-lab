const express = require('express');
const db = require('../db.cjs');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../auth.cjs');
const whisperService = require('../services/whisperService.cjs');
const alignmentService = require('../services/alignmentService.cjs');

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

  const isSilent = req.headers['x-audio-silent'] === 'true' ? 1 : 0;
  console.log(`[Audio Upload] Saved record ${req.params.id}, isSilent = ${isSilent}`);

  db.prepare('UPDATE reading_records SET audio_path = ?, is_silent = ? WHERE id = ?').run(filename, isSilent, req.params.id);
  res.json({ audio_path: filename, is_silent: isSilent === 1 });
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
  
  const stmt = db.prepare(`
    INSERT INTO reading_events (reading_record_id, word, timestamp_ms, event_type, word_index, asr_word, source, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    // If the events being uploaded are manual, we clear existing manual events first
    const hasManual = events.some(e => !e.source || e.source === 'manual');
    const hasAsr = events.some(e => e.source === 'asr');

    if (hasManual) {
      db.prepare("DELETE FROM reading_events WHERE reading_record_id = ? AND (source = 'manual' OR source IS NULL)").run(req.params.recordId);
    }
    if (hasAsr) {
      db.prepare("DELETE FROM reading_events WHERE reading_record_id = ? AND source = 'asr'").run(req.params.recordId);
    }

    for (const e of events) {
      stmt.run(
        req.params.recordId,
        e.word,
        e.timestamp_ms || 0,
        e.event_type,
        e.word_index !== undefined ? e.word_index : null,
        e.asr_word || null,
        e.source || 'manual',
        e.confidence !== undefined ? e.confidence : null
      );
    }
  })();
  res.status(201).json({ count: events.length });
});

// POST /api/records/:id/analyze — Trigger ASR speech-to-text analysis and word alignment
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const recordId = req.params.id;
    const record = db.prepare(`
      SELECT rr.*, a.content AS article_content
      FROM reading_records rr
      JOIN articles a ON a.id = rr.article_id
      WHERE rr.id = ?
    `).get(recordId);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (!record.audio_path) {
      return res.status(400).json({ error: 'No audio recording found for this record' });
    }

    const audioFilePath = path.join(AUDIO_DIR, record.audio_path);
    if (!fs.existsSync(audioFilePath)) {
      return res.status(404).json({ error: 'Audio recording file is missing on server' });
    }

    // 1. Transcribe the audio using Groq Whisper service or handle silence
    let asrResult;
    if (record.is_silent === 1) {
      console.log(`[ASR Analyze] Record ${recordId} is marked as SILENT. Skipping transcription, using empty result.`);
      asrResult = { text: "", words: [], isMock: false };
    } else {
      console.log(`Analyzing record ${recordId} with audio path: ${audioFilePath}`);
      asrResult = await whisperService.transcribeAudio(audioFilePath, record.article_content, recordId);
    }

    // 2. Perform word alignment and pause detection
    const pauseThresholdMs = parseInt(process.env.PAUSE_THRESHOLD_MS) || 2000;
    const analysis = alignmentService.analyzeReading(record.article_content, asrResult, pauseThresholdMs);

    // 3. Save the transcription in the database
    // Delete any existing transcription for this record first to allow re-analysis
    db.prepare('DELETE FROM asr_transcriptions WHERE reading_record_id = ?').run(recordId);
    db.prepare(
      'INSERT INTO asr_transcriptions (reading_record_id, raw_text, words_json) VALUES (?, ?, ?)'
    ).run(recordId, asrResult.text, JSON.stringify(asrResult.words));

    // 4. Save analysis events (misread and pause) in the database
    db.prepare("DELETE FROM reading_events WHERE reading_record_id = ? AND source = 'asr'").run(recordId);

    const insertEventStmt = db.prepare(`
      INSERT INTO reading_events (reading_record_id, word, timestamp_ms, event_type, word_index, asr_word, source)
      VALUES (?, ?, ?, ?, ?, ?, 'asr')
    `);

    db.transaction(() => {
      // Save misreads (substitutions) and skipped words (deletions)
      analysis.alignment.forEach(item => {
        if (item.type === 'substitution') {
          const timestampMs = item.start ? Math.round(item.start * 1000) : 0;
          insertEventStmt.run(recordId, item.originalWord, timestampMs, 'misread', item.originalIndex, item.asrWord);
        } else if (item.type === 'deletion') {
          insertEventStmt.run(recordId, item.originalWord, 0, 'misread', item.originalIndex, null);
        }
      });

      // Save pauses
      analysis.pauses.forEach(pause => {
        const timestampMs = Math.round(pause.startSec * 1000);
        insertEventStmt.run(recordId, pause.afterWord || '', timestampMs, 'pause', pause.afterOriginalIndex, null);
      });
    })();

    res.json({
      success: true,
      stats: analysis.stats,
      alignment: analysis.alignment,
      pauses: analysis.pauses,
      isMock: !!asrResult.isMock
    });
  } catch (error) {
    console.error('ASR analysis endpoint error:', error);
    next(error);
  }
});

// GET /api/records/:id/analysis — Fetch ASR and Manual reading analysis results
router.get('/:id/analysis', (req, res, next) => {
  try {
    const recordId = req.params.id;
    const trans = db.prepare('SELECT * FROM asr_transcriptions WHERE reading_record_id = ?').get(recordId);
    
    if (!trans) {
      return res.json({ analyzed: false });
    }

    const record = db.prepare(`
      SELECT rr.*, a.content AS article_content
      FROM reading_records rr
      JOIN articles a ON a.id = rr.article_id
      WHERE rr.id = ?
    `).get(recordId);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const asrResult = {
      text: trans.raw_text,
      words: JSON.parse(trans.words_json)
    };

    const pauseThresholdMs = parseInt(process.env.PAUSE_THRESHOLD_MS) || 2000;
    const analysis = alignmentService.analyzeReading(record.article_content, asrResult, pauseThresholdMs);

    // Fetch all reading events for manual corrections overlay
    const dbEvents = db.prepare(
      'SELECT * FROM reading_events WHERE reading_record_id = ?'
    ).all(recordId);

    // Overlay manual corrections on top of ASR alignment
    dbEvents.forEach(evt => {
      if (evt.source === 'manual' || !evt.source) {
        if (evt.event_type === 'misread' && evt.word_index !== null) {
          const item = analysis.alignment.find(e => e.originalIndex === evt.word_index);
          if (item) {
            item.type = 'substitution';
            item.manual = true;
          }
        } else if (evt.event_type === 'correct' && evt.word_index !== null) {
          const item = analysis.alignment.find(e => e.originalIndex === evt.word_index);
          if (item) {
            item.type = 'match';
            item.manual = true;
          }
        } else if (evt.event_type === 'pause' && evt.word_index !== null) {
          const exists = analysis.pauses.some(p => p.afterOriginalIndex === evt.word_index);
          if (!exists) {
            analysis.pauses.push({
              durationMs: evt.timestamp_ms || 2000,
              afterOriginalIndex: evt.word_index,
              afterWord: evt.word,
              startSec: 0,
              endSec: 0,
              manual: true
            });
          }
        }
      }
    });

    // Re-calculate statistics with overrides factored in
    const originalWords = record.article_content.match(/[a-zA-Z0-9'’]+(?:[.,\/#!$%\^&\*;:{}=\-_`~()?\"'’]+)?/g) || [];
    const totalWords = originalWords.length;
    const origAlignment = analysis.alignment.filter(e => e.originalIndex !== null);
    const correctWords = origAlignment.filter(e => e.type === 'match').length;
    const misreadWords = origAlignment.filter(e => e.type === 'substitution').length;
    const skippedWords = origAlignment.filter(e => e.type === 'deletion').length;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

    analysis.stats = {
      totalWords,
      correctWords,
      misreadWords,
      skippedWords,
      accuracy
    };

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const isKeyConfigured = (groqKey && groqKey !== 'gsk_your_groq_api_key_here' && groqKey.trim() !== '') ||
                            (openaiKey && openaiKey !== 'sk-your-openai-api-key-here' && openaiKey.trim() !== '');

    res.json({
      analyzed: true,
      stats: analysis.stats,
      alignment: analysis.alignment,
      pauses: analysis.pauses,
      isMock: !isKeyConfigured,
      rawText: trans.raw_text
    });
  } catch (error) {
    console.error('ASR fetch analysis endpoint error:', error);
    next(error);
  }
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

