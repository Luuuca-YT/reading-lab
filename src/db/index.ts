/**
 * Database layer — auto-detects environment:
 * - Electron: uses IPC bridge (window.db from preload)
 * - Web + server: uses REST API with auth token
 * - Web standalone: falls back to Dexie/IndexedDB
 */
import Dexie, { type Table } from 'dexie';
import type {
  Student, StudentCreate, StudentUpdate,
  Tutor, TutorCreate, TutorUpdate,
  Session, SessionCreate,
  Article, ArticleCreate, ArticleUpdate,
  ReadingRecord, ReadingRecordCreate, ReadingRecordUpdate,
  ReadingEvent, ReadingEventCreate,
  StudentFeedback, StudentFeedbackCreate,
  TutorFeedback, TutorFeedbackCreate,
} from './types';

export * from './types';

// ══════════════════════════════════════════
// Environment detection
// ══════════════════════════════════════════
const API = import.meta.env.VITE_API_URL || '';

function isElectron() { return !!(window as any).db; }

function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...options, headers }).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}: ${r.statusText}`);
    return r.json();
  });
}

// Use server API in browser, IPC in Electron
function useServer() { return !isElectron(); }

// ══════════════════════════════════════════
// Dexie (IndexedDB) — local fallback
// ══════════════════════════════════════════
class ReadingLabDB extends Dexie {
  students!: Table<Student, number>;
  tutors!: Table<Tutor, number>;
  sessions!: Table<Session, number>;
  articles!: Table<Article, number>;
  readingRecords!: Table<ReadingRecord, number>;
  readingEvents!: Table<ReadingEvent, number>;
  studentFeedback!: Table<StudentFeedback, number>;
  tutorFeedback!: Table<TutorFeedback, number>;

  constructor() {
    super('ReadingLab');
    this.version(1).stores({
      students: '++id, name, created_at',
      tutors: '++id, name, created_at',
      sessions: '++id, student_id, tutor_id, day_number, date',
      articles: '++id, title, sort_order',
      readingRecords: '++id, session_id, article_id',
      readingEvents: '++id, reading_record_id, event_type',
      studentFeedback: '++id, reading_record_id',
      tutorFeedback: '++id, reading_record_id',
    });
  }
}

const dexie = new ReadingLabDB();

// ══════════════════════════════════════════
// Students
// ══════════════════════════════════════════
export const students = {
  create: async (d: StudentCreate) => {
    if (isElectron()) return (window as any).db.students.create(d);
    if (useServer()) return apiFetch('/api/students', { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.students.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as Student;
  },
  getAll: async () => {
    if (isElectron()) return (window as any).db.students.getAll();
    if (useServer()) return apiFetch('/api/students');
    return dexie.students.orderBy('id').reverse().toArray();
  },
  getById: async (id: number) => {
    if (isElectron()) return (window as any).db.students.getById(id);
    if (useServer()) return apiFetch(`/api/students/${id}`).catch(() => undefined);
    return dexie.students.get(id);
  },
  update: async (id: number, d: StudentUpdate) => {
    if (isElectron()) return (window as any).db.students.update(id, d);
    if (useServer()) return apiFetch(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(d) });
    await dexie.students.update(id, d);
    return (await dexie.students.get(id))!;
  },
  remove: async (id: number) => {
    if (isElectron()) return (window as any).db.students.remove(id);
    if (useServer()) return apiFetch(`/api/students/${id}`, { method: 'DELETE' });
    await dexie.students.delete(id);
    return { success: true };
  },
};

// ══════════════════════════════════════════
// Tutors
// ══════════════════════════════════════════
export const tutors = {
  create: async (d: TutorCreate) => {
    if (isElectron()) return (window as any).db.tutors.create(d);
    if (useServer()) return apiFetch('/api/tutors', { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.tutors.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as Tutor;
  },
  getAll: async () => {
    if (isElectron()) return (window as any).db.tutors.getAll();
    if (useServer()) return apiFetch('/api/tutors');
    return dexie.tutors.orderBy('id').reverse().toArray();
  },
  getById: async (id: number) => {
    if (isElectron()) return (window as any).db.tutors.getById(id);
    if (useServer()) return apiFetch(`/api/tutors/${id}`).catch(() => undefined);
    return dexie.tutors.get(id);
  },
  update: async (id: number, d: TutorUpdate) => {
    if (isElectron()) return (window as any).db.tutors.update(id, d);
    if (useServer()) return apiFetch(`/api/tutors/${id}`, { method: 'PUT', body: JSON.stringify(d) });
    await dexie.tutors.update(id, d);
    return (await dexie.tutors.get(id))!;
  },
  remove: async (id: number) => {
    if (isElectron()) return (window as any).db.tutors.remove(id);
    if (useServer()) return apiFetch(`/api/tutors/${id}`, { method: 'DELETE' });
    await dexie.tutors.delete(id);
    return { success: true };
  },
};

// ══════════════════════════════════════════
// Sessions
// ══════════════════════════════════════════
export const sessions = {
  create: async (d: SessionCreate) => {
    if (isElectron()) return (window as any).db.sessions.create(d);
    if (useServer()) return apiFetch('/api/sessions', { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.sessions.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as Session;
  },
  getByStudentId: async (sid: number) => {
    if (isElectron()) return (window as any).db.sessions.getByStudentId(sid);
    if (useServer()) return apiFetch(`/api/sessions/student/${sid}`);
    return dexie.sessions.where('student_id').equals(sid).reverse().sortBy('date');
  },
  getById: async (id: number) => {
    if (isElectron()) return (window as any).db.sessions.getById(id);
    if (useServer()) return apiFetch(`/api/sessions/${id}`).catch(() => undefined);
    return dexie.sessions.get(id);
  },
  getDayNumber: async (sid: number) => {
    if (isElectron()) return (window as any).db.sessions.getDayNumber(sid);
    if (useServer()) {
      const r = await apiFetch(`/api/sessions/day-number/${sid}`);
      return r.dayNumber;
    }
    const all = await dexie.sessions.where('student_id').equals(sid).toArray();
    return all.length ? Math.max(...all.map((s) => s.day_number)) + 1 : 1;
  },
};

// ══════════════════════════════════════════
// Articles
// ══════════════════════════════════════════
export const articles = {
  getAll: async () => {
    if (isElectron()) return (window as any).db.articles.getAll();
    if (useServer()) return apiFetch('/api/articles');
    return dexie.articles.orderBy('sort_order').toArray();
  },
  getById: async (id: number) => {
    if (isElectron()) return (window as any).db.articles.getById(id);
    if (useServer()) return apiFetch(`/api/articles/${id}`).catch(() => undefined);
    return dexie.articles.get(id);
  },
  create: async (d: ArticleCreate) => {
    if (isElectron()) return (window as any).db.articles.create(d);
    if (useServer()) return apiFetch('/api/articles', { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.articles.add(d as any);
    return { id, ...d } as Article;
  },
  update: async (id: number, d: ArticleUpdate) => {
    if (isElectron()) return (window as any).db.articles.update(id, d);
    if (useServer()) return apiFetch(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(d) });
    await dexie.articles.update(id, d);
    return (await dexie.articles.get(id))!;
  },
  remove: async (id: number) => {
    if (isElectron()) return (window as any).db.articles.remove(id);
    if (useServer()) return apiFetch(`/api/articles/${id}`, { method: 'DELETE' });
    await dexie.articles.delete(id);
    return { success: true };
  },
};

// ══════════════════════════════════════════
// Reading Records
// ══════════════════════════════════════════
export const readingRecords = {
  create: async (d: ReadingRecordCreate) => {
    if (isElectron()) return (window as any).db.readingRecords.create(d);
    if (useServer()) return apiFetch('/api/records', { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.readingRecords.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as ReadingRecord;
  },
  getBySessionId: async (sid: number) => {
    if (isElectron()) return (window as any).db.readingRecords.getBySessionId(sid);
    if (useServer()) return apiFetch(`/api/records/session/${sid}`);
    return dexie.readingRecords.where('session_id').equals(sid).toArray();
  },
  update: async (id: number, d: ReadingRecordUpdate) => {
    if (isElectron()) return (window as any).db.readingRecords.update(id, d);
    await dexie.readingRecords.update(id, d);
    return (await dexie.readingRecords.get(id))!;
  },
  analyze: async (id: number) => {
    if (isElectron()) return { success: false, error: 'ASR is only supported in server/web mode' };
    if (useServer()) return apiFetch(`/api/records/${id}/analyze`, { method: 'POST' });
    return { success: false, error: 'ASR is only supported in server/web mode' };
  },
  getAnalysis: async (id: number) => {
    if (isElectron()) return { analyzed: false };
    if (useServer()) return apiFetch(`/api/records/${id}/analysis`);
    return { analyzed: false };
  },
};

// ══════════════════════════════════════════
// Reading Events
// ══════════════════════════════════════════
export const readingEvents = {
  create: async (d: ReadingEventCreate) => {
    if (isElectron()) return (window as any).db.readingEvents.create(d);
    const id = await dexie.readingEvents.add(d as any);
    return { id, ...d } as ReadingEvent;
  },
  getByRecordId: async (rid: number) => {
    if (isElectron()) return (window as any).db.readingEvents.getByRecordId(rid);
    if (useServer()) return apiFetch(`/api/records/${rid}/events`);
    return dexie.readingEvents.where('reading_record_id').equals(rid).toArray();
  },
  batchCreate: async (events: ReadingEventCreate[]) => {
    if (isElectron()) return (window as any).db.readingEvents.batchCreate(events);
    if (useServer() && events.length > 0) {
      return apiFetch(`/api/records/${events[0].reading_record_id}/events`, {
        method: 'POST', body: JSON.stringify({ events }),
      });
    }
    await dexie.readingEvents.bulkAdd(events as any[]);
    return { count: events.length };
  },
};

// ══════════════════════════════════════════
// Feedback
// ══════════════════════════════════════════
export const feedback = {
  saveStudent: async (d: StudentFeedbackCreate) => {
    if (isElectron()) return (window as any).db.feedback.saveStudent(d);
    if (useServer()) return apiFetch(`/api/records/${d.reading_record_id}/student-feedback`, { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.studentFeedback.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as StudentFeedback;
  },
  saveTutor: async (d: TutorFeedbackCreate) => {
    if (isElectron()) return (window as any).db.feedback.saveTutor(d);
    if (useServer()) return apiFetch(`/api/records/${d.reading_record_id}/tutor-feedback`, { method: 'POST', body: JSON.stringify(d) });
    const id = await dexie.tutorFeedback.add(d as any);
    return { id, ...d, created_at: new Date().toISOString() } as TutorFeedback;
  },
  getStudentByRecordId: async (rid: number) => {
    if (isElectron()) return (window as any).db.feedback.getStudentByRecordId(rid);
    if (useServer()) return apiFetch(`/api/records/${rid}/student-feedback`).catch(() => undefined);
    return dexie.studentFeedback.where('reading_record_id').equals(rid).first();
  },
  getTutorByRecordId: async (rid: number) => {
    if (isElectron()) return (window as any).db.feedback.getTutorByRecordId(rid);
    if (useServer()) return apiFetch(`/api/records/${rid}/tutor-feedback`).catch(() => undefined);
    return dexie.tutorFeedback.where('reading_record_id').equals(rid).first();
  },
};

// ══════════════════════════════════════════
// Admin accounts (server only)
// ══════════════════════════════════════════
export const adminAccounts = {
  list: async () => {
    return apiFetch('/api/auth/accounts');
  },
  create: async (d: { username: string; password: string; displayName?: string; role?: string }) => {
    return apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(d) });
  },
  remove: async (id: number) => {
    return apiFetch(`/api/auth/accounts/${id}`, { method: 'DELETE' });
  },
};
