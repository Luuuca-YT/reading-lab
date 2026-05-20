import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type FeedbackAnswer = string;

interface SessionState {
  sessionId: number | null;
  studentId: number | null;
  studentName: string;
  tutorName: string;
  dayNumber: number;
  date: string;
  currentArticle: number; // 1, 2, or 3
  articleIds: number[];
  // per-article state: { articleOrder: { readingRecordId, feedback } }
  records: Record<number, { readingRecordId: number | null; studentFeedback: FeedbackAnswer[]; tutorFeedback: FeedbackAnswer[]; events: { word: string; timestamp_ms: number; event_type: 'misread' | 'pause' }[] }>;
  // Global Companion & Theme configuration
  selectedCatId?: string | null;
  selectedThemeId?: string | null;
  activeCostume?: 'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null;
}

function initialRecords() {
  return {
    1: { readingRecordId: null, studentFeedback: [], tutorFeedback: [], events: [] },
    2: { readingRecordId: null, studentFeedback: [], tutorFeedback: [], events: [] },
    3: { readingRecordId: null, studentFeedback: [], tutorFeedback: [], events: [] },
  };
}

function initialState(): SessionState {
  return {
    sessionId: null,
    studentId: null,
    studentName: '',
    tutorName: '',
    dayNumber: 1,
    date: new Date().toISOString().slice(0, 10),
    currentArticle: 1,
    articleIds: [],
    records: initialRecords(),
  };
}

const SessionCtx = createContext<{
  session: SessionState;
  setSession: (s: SessionState) => void;
  resetSession: () => void;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(initialState);
  const resetSession = useCallback(() => setSession(initialState()), []);
  return (
    <SessionCtx.Provider value={{ session, setSession, resetSession }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
}
