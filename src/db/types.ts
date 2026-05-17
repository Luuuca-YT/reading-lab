// ── Students ──
export interface Student {
  id: number;
  name: string;
  age: number | null;
  grade: string | null;
  notes: string | null;
  created_at: string;
}

export type StudentCreate = Pick<Student, 'name'> &
  Partial<Pick<Student, 'age' | 'grade' | 'notes'>>;

export type StudentUpdate = Partial<
  Pick<Student, 'name' | 'age' | 'grade' | 'notes'>
>;

// ── Tutors ──
export interface Tutor {
  id: number;
  name: string;
  email: string | null;
  created_at: string;
}

export type TutorCreate = Pick<Tutor, 'name'> & Partial<Pick<Tutor, 'email'>>;

export type TutorUpdate = Partial<Pick<Tutor, 'name' | 'email'>>;

// ── Sessions ──
export interface Session {
  id: number;
  student_id: number;
  tutor_id: number;
  day_number: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export type SessionCreate = Pick<
  Session,
  'student_id' | 'tutor_id' | 'day_number' | 'date'
> &
  Partial<Pick<Session, 'notes'>>;

// ── Articles ──
export interface Article {
  id: number;
  title: string;
  content: string;
  difficulty: number;
  story_group: string | null;
  sort_order: number;
}

export type ArticleCreate = Pick<
  Article,
  'title' | 'content'
> &
  Partial<Pick<Article, 'difficulty' | 'story_group' | 'sort_order'>>;

export type ArticleUpdate = Partial<
  Pick<Article, 'title' | 'content' | 'difficulty' | 'story_group' | 'sort_order'>
>;

// ── Reading Records ──
export interface ReadingRecord {
  id: number;
  session_id: number;
  article_id: number;
  audio_path: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  article_title?: string;
}

export type ReadingRecordCreate = Pick<
  ReadingRecord,
  'session_id' | 'article_id'
> &
  Partial<Pick<ReadingRecord, 'audio_path' | 'start_time' | 'end_time'>>;

export type ReadingRecordUpdate = Partial<
  Pick<ReadingRecord, 'audio_path' | 'start_time' | 'end_time'>
>;

// ── Reading Events ──
export interface ReadingEvent {
  id: number;
  reading_record_id: number;
  word: string;
  timestamp_ms: number;
  event_type: 'misread' | 'pause';
}

export type ReadingEventCreate = Pick<
  ReadingEvent,
  'reading_record_id' | 'word' | 'timestamp_ms' | 'event_type'
>;

// ── Student Feedback ──
export interface StudentFeedback {
  id: number;
  reading_record_id: number;
  q1_understand: string | null;
  q2_difficulty: string | null;
  q3_interest: string | null;
  q4_effort: string | null;
  created_at: string;
}

export type StudentFeedbackCreate = Pick<StudentFeedback, 'reading_record_id'> &
  Partial<
    Pick<
      StudentFeedback,
      'q1_understand' | 'q2_difficulty' | 'q3_interest' | 'q4_effort'
    >
  >;

// ── Tutor Feedback ──
export interface TutorFeedback {
  id: number;
  reading_record_id: number;
  q1_accuracy: string | null;
  q2_fluency: string | null;
  q3_comprehension: string | null;
  q4_notes: string | null;
  created_at: string;
}

export type TutorFeedbackCreate = Pick<TutorFeedback, 'reading_record_id'> &
  Partial<
    Pick<
      TutorFeedback,
      'q1_accuracy' | 'q2_fluency' | 'q3_comprehension' | 'q4_notes'
    >
  >;
