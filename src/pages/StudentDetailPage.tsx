import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { exportStudentCsv } from '../utils/exportCsv';
import {
  students,
  sessions,
  readingRecords,
  readingEvents,
  feedback,
  articles,
} from '../db';
import type { Student, Session, ReadingRecord, Article, ReadingEvent } from '../db';

interface SessionSummary {
  day: number;
  date: string;
  articles: ArticleSummary[];
}

const API = import.meta.env.VITE_API_URL || '';

interface ArticleSummary {
  recordId: number;
  title: string;
  audioPath: string | null;
  misread: number;
  pauses: number;
  studentQ1: string;
  studentQ2: string;
  studentQ3: string;
  studentQ4: string;
  tutorQ1: string;
  tutorQ2: string;
  tutorQ3: string;
  tutorQ4: string;
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRecordings, setHasRecordings] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const s = await students.getById(Number(id));
        if (!s) { setLoading(false); return; }
        setStudent(s);

        const sessList: Session[] = await sessions.getByStudentId(s.id);
        const summaries: SessionSummary[] = [];

        for (const sess of sessList) {
          const recs: ReadingRecord[] = await readingRecords.getBySessionId(sess.id);
          const articleSummaries: ArticleSummary[] = [];

          for (const rec of recs) {
            const art: Article | undefined = await articles.getById(rec.article_id);
            const events = await readingEvents.getByRecordId(rec.id);
            const studentFb = await feedback.getStudentByRecordId(rec.id);
            const tutorFb = await feedback.getTutorByRecordId(rec.id);

            articleSummaries.push({
              recordId: rec.id,
              title: art?.title ?? `Article ${rec.article_id}`,
              audioPath: rec.audio_path ?? null,
              misread: events.filter((e: ReadingEvent) => e.event_type === 'misread').length,
              pauses: events.filter((e: ReadingEvent) => e.event_type === 'pause').length,
              studentQ1: studentFb?.q1_understand ?? '',
              studentQ2: studentFb?.q2_difficulty ?? '',
              studentQ3: studentFb?.q3_interest ?? '',
              studentQ4: studentFb?.q4_effort ?? '',
              tutorQ1: tutorFb?.q1_accuracy ?? '',
              tutorQ2: tutorFb?.q2_fluency ?? '',
              tutorQ3: tutorFb?.q3_comprehension ?? '',
              tutorQ4: tutorFb?.q4_notes ?? '',
            });
          }

          if (articleSummaries.length > 0) {
            summaries.push({
              day: sess.day_number,
              date: sess.date,
              articles: articleSummaries,
            });
          }
        }

        setSessionSummaries(summaries);

        // Check if student has any recordings
        const hasAudio = summaries.some((s) => s.articles.some((a) => a.audioPath));
        setHasRecordings(hasAudio);
      } catch {
        toast('Failed to load student data', 'error');
      }
      setLoading(false);
    })();
  }, [id, toast]);

  // Build chart data
  const chartData = sessionSummaries.map((s) => ({
    day: `Day ${s.day}`,
    misread: s.articles.reduce((sum, a) => sum + a.misread, 0),
    pauses: s.articles.reduce((sum, a) => sum + a.pauses, 0),
  }));

  function handleExport() {
    if (!student) return;
    try {
      exportStudentCsv({
        student: {
          name: student.name,
          age: student.age?.toString() ?? '',
          grade: student.grade ?? '',
        },
        sessions: sessionSummaries.map((s) => ({
          day: s.day,
          date: s.date,
          articles: s.articles,
        })),
      });
      toast('CSV exported', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  }

  if (loading) {
    return (
      <Layout title="Student" backTo="/students">
        <PageSpinner />
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout title="Student" backTo="/students">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-body text-bluebook-400">Student not found.</p>
          <Button onClick={() => navigate('/students')}>Back to Students</Button>
        </div>
      </Layout>
    );
  }

  const totalArticles = sessionSummaries.reduce((s, sess) => s + sess.articles.length, 0);
  const totalMisread = sessionSummaries.reduce((s, sess) => s + sess.articles.reduce((a, art) => a + art.misread, 0), 0);
  const totalPauses = sessionSummaries.reduce((s, sess) => s + sess.articles.reduce((a, art) => a + art.pauses, 0), 0);

  return (
    <Layout title={student.name} backTo="/students">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Info card */}
        <div className="rounded-2xl border border-bluebook-100 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-bluebook-400 uppercase tracking-wide">Student Info</div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Info label="Name" value={student.name} />
                <Info label="Age" value={student.age?.toString() ?? '—'} />
                <Info label="Grade" value={student.grade ?? '—'} />
                <Info label="Sessions" value={sessionSummaries.length.toString()} />
              </div>
              {student.notes && (
                <div className="mt-4 border-t border-bluebook-50 pt-4">
                  <Info label="Notes" value={student.notes} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Sessions" value={sessionSummaries.length.toString()} color="blue" />
          <StatCard label="Articles" value={totalArticles.toString()} color="blue" />
          <StatCard label="Misread" value={totalMisread.toString()} color="red" />
          <StatCard label="Pauses" value={totalPauses.toString()} color="amber" />
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="rounded-2xl border border-bluebook-100 bg-white p-6">
            <h2 className="text-subhead text-bluebook-900 mb-6">Progress</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #DBEAFE',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="misread"
                  name="Misread Words"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="pauses"
                  name="Pauses"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Session history */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-subhead text-bluebook-900">Sessions</h2>
            <div className="flex gap-3">
              {hasRecordings && (
                <a
                  href={`${API}/api/students/${student.id}/recordings/zip`}
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('token');
                    fetch(`${API}/api/students/${student.id}/recordings/zip`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    })
                      .then((r) => {
                        if (!r.ok) throw new Error('Download failed');
                        return r.blob();
                      })
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${student.name.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_')}-recordings.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast('Downloading recordings...', 'info');
                      })
                      .catch(() => toast('Download failed', 'error'));
                  }}
                  className="inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-bluebook-500/30 px-4 py-2 text-sm gap-1.5 border border-bluebook-200 bg-white text-bluebook-700 hover:bg-bluebook-50 active:bg-bluebook-100"
                >
                  Download All Recordings
                </a>
              )}
              <Button variant="secondary" size="sm" onClick={handleExport}>
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/session/setup?studentId=${student.id}`)}
              >
                + New Session
              </Button>
            </div>
          </div>

          {sessionSummaries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-bluebook-200 px-6 py-10 text-center text-body text-bluebook-400">
              No sessions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionSummaries.map((s) => (
                <details key={s.day} className="group rounded-xl border border-bluebook-100 bg-white">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                    <div>
                      <div className="font-medium text-bluebook-900">Day {s.day}</div>
                      <div className="mt-0.5 text-sm text-bluebook-400">
                        {s.date} · {s.articles.length} article{s.articles.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-bluebook-400 group-open:hidden">
                      Details ▾
                    </span>
                    <span className="hidden text-sm font-medium text-bluebook-400 group-open:inline">
                      Hide ▴
                    </span>
                  </summary>
                  <div className="border-t border-bluebook-50 px-5 py-4 space-y-3">
                    {s.articles.map((a, i) => (
                      <div key={i} className="rounded-lg bg-bluebook-50/50 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-bluebook-700">{a.title}</div>
                          {a.audioPath && (
                            <a
                              href={`${API}/api/records/${a.recordId}/audio`}
                              download
                              className="text-xs font-medium text-bluebook-500 hover:text-bluebook-700 underline"
                            >
                              Download Audio
                            </a>
                          )}
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-bluebook-400">
                          <span className="text-red-500">{a.misread} misread</span>
                          <span className="text-amber-500">{a.pauses} pauses</span>
                          <span>Understanding: {a.studentQ1 || '—'}</span>
                          <span>Accuracy: {a.tutorQ1 || '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-bluebook-300 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-body text-bluebook-900">{value}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'red' | 'amber';
}) {
  const bg =
    color === 'red'
      ? 'bg-red-50 text-red-600'
      : color === 'amber'
      ? 'bg-amber-50 text-amber-600'
      : 'bg-bluebook-50 text-bluebook-700';
  const labelColor =
    color === 'red' ? 'text-red-300' : color === 'amber' ? 'text-amber-300' : 'text-bluebook-300';

  return (
    <div className={`rounded-xl border border-bluebook-100 px-5 py-4 text-center ${color === 'red' ? 'bg-red-50/30' : color === 'amber' ? 'bg-amber-50/30' : 'bg-bluebook-50/30'}`}>
      <div className={`text-display ${bg.replace(/^\S+\s/, '').split(' ')[0]}`}>{value}</div>
      <div className={`mt-1 text-xs font-medium uppercase tracking-wide ${labelColor}`}>{label}</div>
    </div>
  );
}
