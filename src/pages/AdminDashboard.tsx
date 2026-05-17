import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PageSpinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { exportStudentCsv } from '../utils/exportCsv';
import {
  students, sessions, readingRecords, readingEvents, feedback, articles,
} from '../db';
import type { Student, Session, ReadingRecord, ReadingEvent, Article, StudentFeedback, TutorFeedback } from '../db';

interface StudentData {
  student: Student;
  sessions: SessionData[];
}

interface SessionData {
  session: Session;
  records: RecordData[];
}

interface RecordData {
  record: ReadingRecord;
  article: Article | undefined;
  events: ReadingEvent[];
  studentFb: StudentFeedback | undefined;
  tutorFb: TutorFeedback | undefined;
}

type Tab = 'overview' | 'students';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    students.getAll().then((list) => {
      setAllStudents(list);
      setLoading(false);
    }).catch(() => {
      toast('Failed to load students', 'error');
      setLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    if (!selectedStudentId) { setStudentData(null); return; }
    setDataLoading(true);
    loadStudentData(selectedStudentId).then((data) => {
      setStudentData(data);
      setDataLoading(false);
    }).catch(() => {
      toast('Failed to load student data', 'error');
      setDataLoading(false);
    });
  }, [selectedStudentId, toast]);

  const filtered = useMemo(
    () => allStudents.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    ),
    [allStudents, search]
  );

  // Aggregate stats for overview
  const overviewStats = useMemo(() => {
    return {
      total: allStudents.length,
    };
  }, [allStudents]);

  if (loading) return <Layout title="Data Explorer" backTo="/"><PageSpinner /></Layout>;

  return (
    <Layout title="Data Explorer" backTo="/">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-bluebook-100 pb-3">
          {([
            ['overview', 'Overview'],
            ['students', 'Students'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-bluebook-700 text-white'
                  : 'text-bluebook-400 hover:bg-bluebook-50 hover:text-bluebook-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <OverviewTab
            totalStudents={overviewStats.total}
            onSelectStudent={(id) => { setSelectedStudentId(id); setTab('students'); }}
          />
        )}

        {tab === 'students' && (
          <StudentsTab
            search={search}
            setSearch={setSearch}
            filtered={filtered}
            selectedId={selectedStudentId}
            onSelect={(id) => setSelectedStudentId(id)}
            studentData={studentData}
            dataLoading={dataLoading}
            toast={toast}
            navigate={navigate}
          />
        )}
      </div>
    </Layout>
  );
}

// ──────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────
function OverviewTab({
  totalStudents,
  onSelectStudent,
}: {
  totalStudents: number;
  onSelectStudent: (id: number) => void;
}) {
  const [summary, setSummary] = useState<{
    totalSessions: number;
    totalArticles: number;
    totalMisread: number;
    totalPauses: number;
    recentStudents: Array<Student & { sessionCount: number; lastDate: string }>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const st = await students.getAll();
      let totalSessions = 0;
      let totalArticles = 0;
      let totalMisread = 0;
      let totalPauses = 0;
      const recent: Array<Student & { sessionCount: number; lastDate: string }> = [];

      for (const s of st) {
        const sess = await sessions.getByStudentId(s.id);
        totalSessions += sess.length;
        for (const se of sess) {
          const recs = await readingRecords.getBySessionId(se.id);
          totalArticles += recs.length;
          for (const r of recs) {
            const evts = await readingEvents.getByRecordId(r.id);
            totalMisread += evts.filter((e: ReadingEvent) => e.event_type === 'misread').length;
            totalPauses += evts.filter((e: ReadingEvent) => e.event_type === 'pause').length;
          }
        }
        recent.push({
          ...s,
          sessionCount: sess.length,
          lastDate: sess[0]?.date ?? '—',
        });
      }

      recent.sort((a, b) => b.sessionCount - a.sessionCount);
      setSummary({ totalSessions, totalArticles, totalMisread, totalPauses, recentStudents: recent.slice(0, 8) });
    })();
  }, []);

  if (!summary) return <PageSpinner />;

  return (
    <div className="space-y-8">
      {/* Big stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <BigStat label="Students" value={totalStudents} />
        <BigStat label="Sessions" value={summary.totalSessions} />
        <BigStat label="Articles Read" value={summary.totalArticles} />
        <BigStat
          label="Avg Misread/Article"
          value={summary.totalArticles ? (summary.totalMisread / summary.totalArticles).toFixed(1) : '0'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-bluebook-100 bg-white p-6">
          <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-4">Reading Activity</h3>
          <div className="space-y-3">
            <StatRow label="Total Misread Words" value={summary.totalMisread} color="red" />
            <StatRow label="Total Pauses" value={summary.totalPauses} color="amber" />
            <StatRow label="Misread per Session" value={summary.totalSessions ? (summary.totalMisread / summary.totalSessions).toFixed(1) : '0'} color="blue" />
            <StatRow label="Pauses per Session" value={summary.totalSessions ? (summary.totalPauses / summary.totalSessions).toFixed(1) : '0'} color="blue" />
          </div>
        </div>

        <div className="rounded-2xl border border-bluebook-100 bg-white p-6">
          <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-4">Top Readers</h3>
          <div className="space-y-2">
            {summary.recentStudents.map((s, i) => (
              <button
                key={s.id}
                onClick={() => onSelectStudent(s.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-bluebook-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-bluebook-300 w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-bluebook-900">{s.name}</span>
                </div>
                <span className="text-xs text-bluebook-400">{s.sessionCount} sessions</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Students Tab
// ──────────────────────────────────────────
function StudentsTab({
  search, setSearch, filtered, selectedId, onSelect, studentData, dataLoading, toast, navigate,
}: {
  search: string;
  setSearch: (v: string) => void;
  filtered: Student[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  studentData: StudentData | null;
  dataLoading: boolean;
  toast: ReturnType<typeof useToast>['toast'];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const sel = filtered.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Student list */}
      <div className="space-y-3">
        <Input
          label="Search"
          placeholder="Student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-[70vh] space-y-1 overflow-y-auto">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                selectedId === s.id
                  ? 'bg-bluebook-100 text-bluebook-900 font-medium'
                  : 'text-bluebook-600 hover:bg-bluebook-50'
              }`}
            >
              {s.name}
              <span className="ml-2 text-xs text-bluebook-300">
                {s.grade && `· ${s.grade}`}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-bluebook-400 py-4 text-center">No students found</p>
          )}
        </div>
      </div>

      {/* Right: Student detail */}
      <div className="col-span-2">
        {!sel ? (
          <div className="flex items-center justify-center h-64 rounded-2xl border border-dashed border-bluebook-200">
            <p className="text-body text-bluebook-400">Select a student to view data</p>
          </div>
        ) : dataLoading ? (
          <PageSpinner />
        ) : studentData ? (
          <StudentDetailPanel
            data={studentData}
            onExport={() => {
              try {
                exportStudentCsv(buildCsvData(studentData));
                toast('CSV exported', 'success');
              } catch {
                toast('Export failed', 'error');
              }
            }}
            onNewSession={() => navigate(`/session/setup?studentId=${sel.id}`)}
          />
        ) : null}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Student Detail Panel
// ──────────────────────────────────────────
function StudentDetailPanel({
  data, onExport, onNewSession,
}: {
  data: StudentData;
  onExport: () => void;
  onNewSession: () => void;
}) {
  const { student, sessions: sessionList } = data;
  const allEvents = sessionList.flatMap((s) => s.records.flatMap((r) => r.events));
  const totalMisread = allEvents.filter((e) => e.event_type === 'misread').length;
  const totalPauses = allEvents.filter((e) => e.event_type === 'pause').length;

  // Chart: each session as a bar
  const chartData = sessionList.map((s) => {
    const allRecEvents = s.records.flatMap((r) => r.events);
    return {
      name: `Day ${s.session.day_number}`,
      misread: allRecEvents.filter((e) => e.event_type === 'misread').length,
      pauses: allRecEvents.filter((e) => e.event_type === 'pause').length,
    };
  });

  // Word frequency
  const wordFreq: Record<string, number> = {};
  allEvents.filter((e) => e.event_type === 'misread' && e.word !== '(pause)').forEach((e) => {
    wordFreq[e.word] = (wordFreq[e.word] || 0) + 1;
  });
  const topWords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-heading text-bluebook-900">{student.name}</h2>
          <p className="text-sm text-bluebook-400 mt-1">
            {student.grade && `${student.grade} · `}
            {student.age && `Age ${student.age} · `}
            {sessionList.length} session{sessionList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onExport}>Export CSV</Button>
          <Button size="sm" onClick={onNewSession}>+ Session</Button>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Sessions" value={sessionList.length} />
        <MiniStat label="Articles" value={sessionList.reduce((s, sess) => s + sess.records.length, 0)} />
        <MiniStat label="Misread" value={totalMisread} color="red" />
        <MiniStat label="Pauses" value={totalPauses} color="amber" />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl border border-bluebook-100 bg-white p-5">
          <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-4">Session Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #DBEAFE', fontSize: 13 }}
              />
              <Bar dataKey="misread" name="Misread" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pauses" name="Pauses" fill="#FCD34D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Misread words */}
      {topWords.length > 0 && (
        <div className="rounded-xl border border-bluebook-100 bg-white p-5">
          <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-4">
            Most Misread Words
          </h3>
          <div className="flex flex-wrap gap-2">
            {topWords.map(([word, count]) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm"
              >
                <span className="font-medium text-red-700">{word}</span>
                <span className="text-xs text-red-400">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-session breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide">Session History</h3>
        {sessionList.map((sessData) => {
          const sess = sessData.session;
          const recEvents = sessData.records.flatMap((r) => r.events);
          const mCount = recEvents.filter((e) => e.event_type === 'misread').length;
          const pCount = recEvents.filter((e) => e.event_type === 'pause').length;

          return (
            <details key={sess.id} className="group rounded-xl border border-bluebook-100 bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                <div>
                  <span className="font-medium text-bluebook-900">Day {sess.day_number}</span>
                  <span className="ml-3 text-sm text-bluebook-400">{sess.date}</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-red-500">{mCount} misread</span>
                  <span className="text-amber-500">{pCount} pauses</span>
                  <span className="text-bluebook-300 group-open:hidden">▾</span>
                  <span className="text-bluebook-300 hidden group-open:inline">▴</span>
                </div>
              </summary>
              <div className="border-t border-bluebook-50 px-5 py-4 space-y-4">
                {sessData.records.map((rec) => {
                  const misreadWords = rec.events
                    .filter((e) => e.event_type === 'misread')
                    .map((e) => ({ word: e.word, time: e.timestamp_ms }));
                  const pauses = rec.events
                    .filter((e) => e.event_type === 'pause')
                    .map((e) => e.timestamp_ms);

                  return (
                    <div key={rec.record.id} className="rounded-lg bg-bluebook-50/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-bluebook-800">
                          {rec.article?.title ?? `Article ${rec.record.article_id}`}
                        </span>
                        <div className="flex gap-3 text-xs">
                          <span className="text-red-500">{misreadWords.length} misread</span>
                          <span className="text-amber-500">{pauses.length} pauses</span>
                        </div>
                      </div>

                      {/* Misread words timeline */}
                      {misreadWords.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-bluebook-400 mb-1.5">Misread words:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {misreadWords.map((e, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs">
                                <span className="text-red-700 font-medium">{e.word}</span>
                                <span className="text-red-300">{formatMsShort(e.time)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pause timeline */}
                      {pauses.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-bluebook-400 mb-1.5">Pauses at:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {pauses.map((ts, i) => (
                              <span key={i} className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                                {formatMsShort(ts)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback comparison */}
                      {(rec.studentFb || rec.tutorFb) && (
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs border-t border-bluebook-100 pt-3">
                          <div>
                            <div className="font-medium text-bluebook-400 mb-1">Student Feedback</div>
                            {rec.studentFb ? (
                              <div className="space-y-0.5 text-bluebook-600">
                                <div>Understanding: {rec.studentFb.q1_understand || '—'}</div>
                                <div>Difficulty: {rec.studentFb.q2_difficulty || '—'}</div>
                                <div>Interest: {rec.studentFb.q3_interest || '—'}</div>
                                <div>Effort: {rec.studentFb.q4_effort || '—'}</div>
                              </div>
                            ) : <span className="text-bluebook-300">No data</span>}
                          </div>
                          <div>
                            <div className="font-medium text-bluebook-400 mb-1">Tutor Feedback</div>
                            {rec.tutorFb ? (
                              <div className="space-y-0.5 text-bluebook-600">
                                <div>Accuracy: {rec.tutorFb.q1_accuracy || '—'}</div>
                                <div>Fluency: {rec.tutorFb.q2_fluency || '—'}</div>
                                <div>Comprehension: {rec.tutorFb.q3_comprehension || '—'}</div>
                                <div>Notes: {rec.tutorFb.q4_notes || '—'}</div>
                              </div>
                            ) : <span className="text-bluebook-300">No data</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
        {sessionList.length === 0 && (
          <p className="text-sm text-bluebook-400 text-center py-8">No sessions yet.</p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function BigStat({ label, value }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-2xl border border-bluebook-100 bg-white p-6 text-center">
      <div className="text-display text-bluebook-700">{value}</div>
      <div className="mt-1 text-xs font-medium text-bluebook-300 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color = 'blue' }: { label: string; value: number; color?: 'blue' | 'red' | 'amber' }) {
  const colors = { blue: 'text-bluebook-700', red: 'text-red-500', amber: 'text-amber-500' };
  return (
    <div className="rounded-xl border border-bluebook-100 bg-white px-4 py-3 text-center">
      <div className={`text-xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-xs text-bluebook-300 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color: 'red' | 'amber' | 'blue' }) {
  const colors = { red: 'text-red-500', amber: 'text-amber-500', blue: 'text-bluebook-700' };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-bluebook-500">{label}</span>
      <span className={`text-sm font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
}

function formatMsShort(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

async function loadStudentData(studentId: number): Promise<StudentData> {
  const student = await students.getById(studentId);
  if (!student) throw new Error('Student not found');

  const sessList: Session[] = await sessions.getByStudentId(studentId);
  const sessionsData: SessionData[] = [];

  for (const sess of sessList) {
    const recs: ReadingRecord[] = await readingRecords.getBySessionId(sess.id);
    const recordsData: RecordData[] = [];

    for (const rec of recs) {
      const [art, evts, sFb, tFb] = await Promise.all([
        articles.getById(rec.article_id),
        readingEvents.getByRecordId(rec.id),
        feedback.getStudentByRecordId(rec.id),
        feedback.getTutorByRecordId(rec.id),
      ]);
      recordsData.push({
        record: rec,
        article: art,
        events: evts,
        studentFb: sFb,
        tutorFb: tFb,
      });
    }

    sessionsData.push({ session: sess, records: recordsData });
  }

  return { student, sessions: sessionsData };
}

function buildCsvData(data: StudentData) {
  return {
    student: {
      name: data.student.name,
      age: data.student.age?.toString() ?? '',
      grade: data.student.grade ?? '',
    },
    sessions: data.sessions.map((s) => ({
      day: s.session.day_number,
      date: s.session.date,
      articles: s.records.map((r) => {
        const events = r.events;
        return {
          title: r.article?.title ?? '',
          misread: events.filter((e) => e.event_type === 'misread').length,
          pauses: events.filter((e) => e.event_type === 'pause').length,
          studentQ1: r.studentFb?.q1_understand ?? '',
          studentQ2: r.studentFb?.q2_difficulty ?? '',
          studentQ3: r.studentFb?.q3_interest ?? '',
          studentQ4: r.studentFb?.q4_effort ?? '',
          tutorQ1: r.tutorFb?.q1_accuracy ?? '',
          tutorQ2: r.tutorFb?.q2_fluency ?? '',
          tutorQ3: r.tutorFb?.q3_comprehension ?? '',
          tutorQ4: r.tutorFb?.q4_notes ?? '',
        };
      }),
    })),
  };
}
