const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { getDb, closeDb } = require('./database.cjs');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';

let mainWindow = null;

// ──────────────────────────────────────────────
// IPC Handlers — Students
// ──────────────────────────────────────────────
ipcMain.handle('db:students:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO students (name, age, grade, notes) VALUES (@name, @age, @grade, @notes)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:students:getAll', () => {
  return getDb().prepare('SELECT * FROM students ORDER BY created_at DESC').all();
});

ipcMain.handle('db:students:getById', (_e, id) => {
  return getDb().prepare('SELECT * FROM students WHERE id = ?').get(id);
});

ipcMain.handle('db:students:update', (_e, id, data) => {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE students SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM students WHERE id = ?').get(id);
});

ipcMain.handle('db:students:remove', (_e, id) => {
  getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────
// IPC Handlers — Tutors
// ──────────────────────────────────────────────
ipcMain.handle('db:tutors:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO tutors (name, email) VALUES (@name, @email)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:tutors:getAll', () => {
  return getDb().prepare('SELECT * FROM tutors ORDER BY created_at DESC').all();
});

ipcMain.handle('db:tutors:getById', (_e, id) => {
  return getDb().prepare('SELECT * FROM tutors WHERE id = ?').get(id);
});

ipcMain.handle('db:tutors:update', (_e, id, data) => {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE tutors SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM tutors WHERE id = ?').get(id);
});

ipcMain.handle('db:tutors:remove', (_e, id) => {
  getDb().prepare('DELETE FROM tutors WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────
// IPC Handlers — Sessions
// ──────────────────────────────────────────────
ipcMain.handle('db:sessions:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO sessions (student_id, tutor_id, day_number, date, notes) VALUES (@student_id, @tutor_id, @day_number, @date, @notes)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:sessions:getByStudentId', (_e, studentId) => {
  return getDb()
    .prepare('SELECT * FROM sessions WHERE student_id = ? ORDER BY date DESC')
    .all(studentId);
});

ipcMain.handle('db:sessions:getById', (_e, id) => {
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id);
});

ipcMain.handle('db:sessions:getDayNumber', (_e, studentId) => {
  const row = getDb()
    .prepare(
      'SELECT COALESCE(MAX(day_number), 0) + 1 AS next_day FROM sessions WHERE student_id = ?'
    )
    .get(studentId);
  return row.next_day;
});

// ──────────────────────────────────────────────
// IPC Handlers — Articles
// ──────────────────────────────────────────────
ipcMain.handle('db:articles:getAll', () => {
  return getDb().prepare('SELECT * FROM articles ORDER BY sort_order').all();
});

ipcMain.handle('db:articles:getById', (_e, id) => {
  return getDb().prepare('SELECT * FROM articles WHERE id = ?').get(id);
});

ipcMain.handle('db:articles:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO articles (title, content, difficulty, story_group, sort_order) VALUES (@title, @content, @difficulty, @story_group, @sort_order)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:articles:update', (_e, id, data) => {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE articles SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
});

ipcMain.handle('db:articles:remove', (_e, id) => {
  getDb().prepare('DELETE FROM articles WHERE id = ?').run(id);
  return { success: true };
});

// ──────────────────────────────────────────────
// IPC Handlers — Reading Records
// ──────────────────────────────────────────────
ipcMain.handle('db:readingRecords:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO reading_records (session_id, article_id, audio_path, start_time, end_time) VALUES (@session_id, @article_id, @audio_path, @start_time, @end_time)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:readingRecords:getBySessionId', (_e, sessionId) => {
  return getDb()
    .prepare(
      `SELECT rr.*, a.title AS article_title
       FROM reading_records rr
       JOIN articles a ON a.id = rr.article_id
       WHERE rr.session_id = ?
       ORDER BY rr.created_at`
    )
    .all(sessionId);
});

ipcMain.handle('db:readingRecords:update', (_e, id, data) => {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE reading_records SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM reading_records WHERE id = ?').get(id);
});

// ──────────────────────────────────────────────
// IPC Handlers — Reading Events
// ──────────────────────────────────────────────
ipcMain.handle('db:readingEvents:create', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO reading_events (reading_record_id, word, timestamp_ms, event_type) VALUES (@reading_record_id, @word, @timestamp_ms, @event_type)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:readingEvents:getByRecordId', (_e, recordId) => {
  return getDb()
    .prepare('SELECT * FROM reading_events WHERE reading_record_id = ? ORDER BY timestamp_ms')
    .all(recordId);
});

ipcMain.handle('db:readingEvents:batchCreate', (_e, events) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO reading_events (reading_record_id, word, timestamp_ms, event_type) VALUES (@reading_record_id, @word, @timestamp_ms, @event_type)'
  );
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item);
    }
  });
  insertMany(events);
  return { count: events.length };
});

// ──────────────────────────────────────────────
// IPC Handlers — Feedback
// ──────────────────────────────────────────────
ipcMain.handle('db:feedback:saveStudent', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO student_feedback (reading_record_id, q1_understand, q2_difficulty, q3_interest, q4_effort) VALUES (@reading_record_id, @q1_understand, @q2_difficulty, @q3_interest, @q4_effort)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:feedback:saveTutor', (_e, data) => {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO tutor_feedback (reading_record_id, q1_accuracy, q2_fluency, q3_comprehension, q4_notes) VALUES (@reading_record_id, @q1_accuracy, @q2_fluency, @q3_comprehension, @q4_notes)'
  );
  const result = stmt.run(data);
  return { id: result.lastInsertRowid, ...data };
});

ipcMain.handle('db:feedback:getStudentByRecordId', (_e, recordId) => {
  return getDb()
    .prepare('SELECT * FROM student_feedback WHERE reading_record_id = ?')
    .get(recordId);
});

ipcMain.handle('db:feedback:getTutorByRecordId', (_e, recordId) => {
  return getDb()
    .prepare('SELECT * FROM tutor_feedback WHERE reading_record_id = ?')
    .get(recordId);
});

// ──────────────────────────────────────────────
// Window
// ──────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Reading Lab',
    backgroundColor: '#FFFFFF',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Init DB (creates tables if needed) and seed articles
  getDb();
  require('./seed.cjs');
  createWindow();
});

app.on('window-all-closed', () => {
  closeDb();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
