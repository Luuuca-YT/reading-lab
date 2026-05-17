import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';

const questions = [
  {
    key: 'q1_accuracy',
    label: 'How accurate was the student\'s reading?',
    type: 'stars' as const,
  },
  {
    key: 'q2_fluency',
    label: 'How fluent was the reading?',
    type: 'stars' as const,
  },
  {
    key: 'q3_comprehension',
    label: 'Did the student understand the content?',
    type: 'choice' as const,
    options: ['Yes', 'Partially', 'No'],
  },
  {
    key: 'q4_notes',
    label: 'Additional notes for this session',
    type: 'text' as const,
    placeholder: 'Any observations about the student\'s reading...',
  },
];

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-all ${
            n <= value
              ? 'bg-bluebook-700 text-white shadow-md'
              : 'border-2 border-bluebook-100 text-bluebook-300 hover:border-bluebook-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function TutorFeedbackPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const order = Number(articleOrder);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setSession({
        ...session,
        records: {
          ...session.records,
          [order]: {
            ...session.records[order],
            tutorFeedback: questions.map((q) => answers[q.key] ?? ''),
          },
        },
      });

      if (order < 3) {
        // Go to next article
        setSession({ ...session, currentArticle: order + 1 });
        navigate(`/session/${id}/ready`);
      } else {
        // Session complete
        navigate(`/session/${id}/complete`);
      }
    }
  }

  const q = questions[step];
  const currentValue = answers[q.key] ?? '';

  return (
    <Layout title={`Tutor Feedback · Article ${order}`} backTo={`/session/${id}/feedback/${order}`}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-12">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-10 rounded-full ${
                i <= step ? 'bg-bluebook-500' : 'bg-bluebook-100'
              }`}
            />
          ))}
        </div>

        <div className="w-full rounded-2xl border border-bluebook-100 bg-white p-8 text-center">
          <p className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-6">
            Tutor Question {step + 1} of {questions.length}
          </p>
          <h2 className="text-heading text-bluebook-900 mb-8">{q.label}</h2>

          {q.type === 'stars' ? (
            <div className="flex justify-center">
              <Stars
                value={Number(currentValue) || 0}
                onChange={(v) => setAnswer(q.key, String(v))}
              />
            </div>
          ) : q.type === 'choice' ? (
            <div className="flex justify-center gap-4">
              {q.options!.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.key, opt)}
                  className={`rounded-xl border-2 px-8 py-4 text-lg font-medium transition-all ${
                    currentValue === opt
                      ? 'border-bluebook-500 bg-bluebook-50 text-bluebook-700'
                      : 'border-bluebook-100 text-bluebook-400 hover:border-bluebook-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="w-full rounded-xl border border-bluebook-200 bg-white px-4 py-3 text-body text-bluebook-900 placeholder:text-bluebook-300 focus:border-bluebook-500 focus:outline-none focus:ring-2 focus:ring-bluebook-500/20 resize-none"
              rows={4}
              placeholder={q.placeholder}
              value={currentValue}
              onChange={(e) => setAnswer(q.key, e.target.value)}
            />
          )}
        </div>

        <Button size="lg" onClick={handleNext}>
          {step < questions.length - 1
            ? 'Next'
            : order < 3
            ? 'Next Article'
            : 'Complete Session'}
        </Button>
      </div>
    </Layout>
  );
}
