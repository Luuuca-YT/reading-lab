const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'reading-lab.db');
}

function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      grade TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tutors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id),
      tutor_id INTEGER NOT NULL REFERENCES tutors(id),
      day_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      difficulty INTEGER DEFAULT 1,
      story_group TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reading_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      article_id INTEGER NOT NULL REFERENCES articles(id),
      audio_path TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reading_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
      word TEXT NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('misread', 'pause'))
    );

    CREATE TABLE IF NOT EXISTS student_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
      q1_understand TEXT,
      q2_difficulty TEXT,
      q3_interest TEXT,
      q4_effort TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tutor_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
      q1_accuracy TEXT,
      q2_fluency TEXT,
      q3_comprehension TEXT,
      q4_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, getDbPath, closeDb };
