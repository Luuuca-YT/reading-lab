import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { students, tutors, sessions, articles } from '../db';
import type { Student, Tutor, Article } from '../db';

export function SessionSetupPage() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const { toast } = useToast();

  const [studentList, setStudentList] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [tutorName, setTutorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await students.getAll();
        setStudentList(list);
      } catch {
        toast('Failed to load student list', 'error');
      }
      setLoading(false);
    })();
  }, []);

  async function handleStart() {
    setError('');
    if (!selectedStudent) { setError('Please select a student.'); return; }
    if (!tutorName.trim()) { setError('Please enter the tutor name.'); return; }

    try {
      // Find or create tutor
      let tutor: Tutor | undefined;
      const allTutors = await tutors.getAll();
      tutor = allTutors.find((t: Tutor) => t.name.toLowerCase() === tutorName.trim().toLowerCase());
      if (!tutor) {
        tutor = await tutors.create({ name: tutorName.trim() });
      }

      if (!tutor) return; // safety guard

      // Calculate day number
      const dayNumber = await sessions.getDayNumber(selectedStudent.id);

      // Create session
      const sess = await sessions.create({
        student_id: selectedStudent.id,
        tutor_id: tutor.id,
        day_number: dayNumber,
        date,
      });

      // Load articles
      const arts: Article[] = await articles.getAll();
      const articleIds = arts.slice(0, 3).map((a) => a.id);

      setSession({
        ...session,
        sessionId: sess.id,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        tutorName: tutorName.trim(),
        dayNumber,
        date,
        currentArticle: 1,
        articleIds,
      });

      navigate(`/session/${sess.id}/ready`);
    } catch (err: any) {
      console.error('[SessionSetup]', err);
      setError(err.message || 'Failed to start session. Please try again.');
    }
  }

  return (
    <Layout title="New Session" backTo="/">
      <div className="mx-auto max-w-lg space-y-8">
        {loading ? (
          <PageSpinner />
        ) : (
          <>
            {/* Student select */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-bluebook-400 uppercase tracking-wide">
                Student
              </label>
              {studentList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-bluebook-200 p-6 text-center">
                  <p className="text-body text-bluebook-400 mb-4">No students yet.</p>
                  <Button size="sm" onClick={() => navigate('/students/new')}>
                    + Create Student
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {studentList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className={`rounded-xl border px-5 py-4 text-left transition-all ${
                        selectedStudent?.id === s.id
                          ? 'border-bluebook-500 bg-bluebook-50 ring-2 ring-bluebook-500/20'
                          : 'border-bluebook-100 hover:border-bluebook-200'
                      }`}
                    >
                      <div className="font-medium text-bluebook-900">{s.name}</div>
                      <div className="text-sm text-bluebook-400">
                        {[s.grade, s.age && `Age ${s.age}`].filter(Boolean).join(' · ')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Tutor Name"
              placeholder="e.g. Ms. Johnson"
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {selectedStudent && (
              <div className="rounded-xl border border-bluebook-100 bg-bluebook-50/50 p-4 text-center">
                <span className="text-sm text-bluebook-400">Day Number</span>
                <div className="text-display text-bluebook-700">
                  {session.dayNumber || '—'}
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleStart}
              disabled={studentList.length === 0}
            >
              Start Reading
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
