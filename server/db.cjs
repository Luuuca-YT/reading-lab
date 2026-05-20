const Database = require('better-sqlite3');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'reading-lab-shared.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'tutor',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    grade TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES admins(id),
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
    is_silent INTEGER DEFAULT 0,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reading_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
    word TEXT NOT NULL,
    timestamp_ms INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('misread', 'pause', 'correct'))
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

  CREATE TABLE IF NOT EXISTS daily_confidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    phase TEXT NOT NULL CHECK(phase IN ('before', 'after')),
    confidence TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, phase)
  );
`);

// Run database migrations / schema expansions for ASR support
try {
  const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='reading_events'").get()?.sql || '';
  if (!tableSql.includes("'correct'")) {
    console.log('Migrating reading_events table check constraint to support "correct" event type...');
    db.exec(`
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;
      CREATE TABLE IF NOT EXISTS reading_events_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
        word TEXT NOT NULL,
        timestamp_ms INTEGER NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('misread', 'pause', 'correct')),
        word_index INTEGER,
        asr_word TEXT,
        source TEXT DEFAULT 'manual',
        confidence REAL
      );
    `);
    
    try {
      db.exec(`
        INSERT INTO reading_events_new (id, reading_record_id, word, timestamp_ms, event_type, word_index, asr_word, source, confidence)
        SELECT id, reading_record_id, word, timestamp_ms, event_type, word_index, asr_word, source, confidence FROM reading_events;
      `);
    } catch (err) {
      db.exec(`
        INSERT INTO reading_events_new (id, reading_record_id, word, timestamp_ms, event_type)
        SELECT id, reading_record_id, word, timestamp_ms, event_type FROM reading_events;
      `);
    }

    db.exec(`
      DROP TABLE reading_events;
      ALTER TABLE reading_events_new RENAME TO reading_events;
      COMMIT;
      PRAGMA foreign_keys=ON;
    `);
    console.log('reading_events constraint migration completed successfully.');
  } else {
    // Columns might already exist but let's make sure they do
    try { db.exec("ALTER TABLE reading_events ADD COLUMN word_index INTEGER;"); } catch (e) {}
    try { db.exec("ALTER TABLE reading_events ADD COLUMN asr_word TEXT;"); } catch (e) {}
    try { db.exec("ALTER TABLE reading_events ADD COLUMN source TEXT DEFAULT 'manual';"); } catch (e) {}
    try { db.exec("ALTER TABLE reading_events ADD COLUMN confidence REAL;"); } catch (e) {}
  }
} catch (e) {
  console.error('Failed to run reading_events constraint migration, running column additions fallback:', e);
  try { db.exec("ALTER TABLE reading_events ADD COLUMN word_index INTEGER;"); } catch (e) {}
  try { db.exec("ALTER TABLE reading_events ADD COLUMN asr_word TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE reading_events ADD COLUMN source TEXT DEFAULT 'manual';"); } catch (e) {}
  try { db.exec("ALTER TABLE reading_events ADD COLUMN confidence REAL;"); } catch (e) {}
}

try {
  db.exec("ALTER TABLE reading_records ADD COLUMN is_silent INTEGER DEFAULT 0;");
  console.log('Added is_silent column to reading_records successfully.');
} catch (e) {
  // Column already exists, ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS asr_transcriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_record_id INTEGER NOT NULL REFERENCES reading_records(id),
    raw_text TEXT NOT NULL,
    words_json TEXT NOT NULL,
    model TEXT DEFAULT 'whisper-large-v3',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);


// Seed articles
const count = db.prepare('SELECT COUNT(*) AS count FROM articles').get().count;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO articles (title, content, difficulty, story_group, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    insert.run(
      'The Lost Kitten',
      'Emma was walking home from school when she heard a tiny sound. It was coming from behind a big oak tree. She looked closer and saw a small gray kitten. It was all alone and looked very scared. Emma picked it up gently. "Where is your home?" she asked softly. The kitten just mewed. Emma carried it to her house. Her mom gave it some milk. Together, they put up signs in the neighborhood. The next day, a little girl named Mia came to their door. She had been looking everywhere for her kitten! Mia was so happy to see her pet again. She thanked Emma with a big smile.',
      1, 'A', 1
    );
    insert.run(
      'A Rainy Day Adventure',
      'Max stared out the window. Rain was falling hard, and he could not go outside to play. "What should I do?" he thought. He looked around his room and saw an old map on his desk. It was a map his grandpa gave him last summer. Max spread the map across his floor. It showed a treasure path through the house! First, he went to the kitchen. Under the table, he found a small box with cookies inside. Next, he went to the living room. Behind the sofa, he found a new pack of colored pencils. Last, he went to his own closet. Inside a shoe box, he found a note that said, "The best treasure is your imagination." Max smiled and sat down to draw.',
      2, 'A', 2
    );
    insert.run(
      'The Star Project',
      'Lily\'s class was doing a science project about stars. Every student had to pick one star and learn everything about it. Lily picked Sirius, the brightest star in the night sky. She read three books about stars. She learned that Sirius is actually two stars, not one. They spin around each other in space. She also learned that ancient people used Sirius to know when to plant their crops. On the day of the project, Lily stood in front of her class. She showed a drawing of Sirius and its partner star. She spoke clearly and shared all the facts she had learned. When she finished, her teacher said, "That was excellent, Lily." Lily felt proud of her hard work.',
      3, 'B', 3
    );
  })();
}

module.exports = db;
