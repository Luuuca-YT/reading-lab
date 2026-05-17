import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import { useSession } from '../context/SessionContext';

export function SessionCompletePage() {
  const navigate = useNavigate();
  const { session, resetSession } = useSession();
  const [showConfidence, setShowConfidence] = useState(true);

  const totalMisread = [1, 2, 3].reduce(
    (sum, i) =>
      sum + (session.records[i]?.events?.filter((e) => e.event_type === 'misread').length ?? 0),
    0
  );
  const totalPauses = [1, 2, 3].reduce(
    (sum, i) =>
      sum + (session.records[i]?.events?.filter((e) => e.event_type === 'pause').length ?? 0),
    0
  );

  function handleDone() {
    resetSession();
    navigate('/');
  }

  if (showConfidence && session.sessionId) {
    return (
      <Layout title={`Day ${session.dayNumber} · After reading`}>
        <div className="mx-auto max-w-4xl py-12">
          <div className="text-center mb-8">
            <div className="inline-block rounded-full bg-emerald-100 px-5 py-2 text-sm font-medium text-emerald-700">
              {session.studentName} · Day {session.dayNumber} done
            </div>
          </div>
          <ConfidenceCheck
            sessionId={session.sessionId}
            phase="after"
            onSubmit={() => setShowConfidence(false)}
            buttonLabel="See Summary"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Session Complete">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-16 text-center">
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-emerald-100 px-5 py-2 text-sm font-medium text-emerald-700">
            {session.studentName}
          </div>
          <h1 className="text-display text-bluebook-900">Day {session.dayNumber} Complete!</h1>
          <p className="text-body text-bluebook-400">
            Great job today. All data has been saved.
          </p>
        </div>

        {/* Stats */}
        <div className="grid w-full grid-cols-3 gap-4">
          <div className="rounded-xl border border-bluebook-100 bg-bluebook-50/50 px-5 py-4">
            <div className="text-display text-bluebook-700">3</div>
            <div className="mt-1 text-xs font-medium text-bluebook-300 uppercase tracking-wide">
              Articles Read
            </div>
          </div>
          <div className="rounded-xl border border-bluebook-100 bg-red-50 px-5 py-4">
            <div className="text-display text-red-500">{totalMisread}</div>
            <div className="mt-1 text-xs font-medium text-red-300 uppercase tracking-wide">
              Misread Words
            </div>
          </div>
          <div className="rounded-xl border border-bluebook-100 bg-amber-50 px-5 py-4">
            <div className="text-display text-amber-500">{totalPauses}</div>
            <div className="mt-1 text-xs font-medium text-amber-300 uppercase tracking-wide">
              Pauses
            </div>
          </div>
        </div>

        {/* Per-article summary */}
        <div className="w-full space-y-3">
          <h3 className="text-sm font-medium text-bluebook-400 uppercase tracking-wide text-left">
            Article Summary
          </h3>
          {[1, 2, 3].map((i) => {
            const rec = session.records[i];
            const misreadCount = rec?.events?.filter((e) => e.event_type === 'misread').length ?? 0;
            const pauseCount = rec?.events?.filter((e) => e.event_type === 'pause').length ?? 0;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-bluebook-100 bg-white px-5 py-4"
              >
                <div className="text-left">
                  <div className="font-medium text-bluebook-900">Article {i}</div>
                  <div className="text-sm text-bluebook-400">
                    {rec?.studentFeedback?.[1] ?? '—'} · {rec?.tutorFeedback?.[1] ?? '—'}
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-red-500">{misreadCount} misread</span>
                  <span className="text-amber-500">{pauseCount} pauses</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" size="lg" onClick={() => navigate(`/students/${session.studentId}`)}>
            View Student
          </Button>
          <Button size="lg" onClick={handleDone}>
            Back to Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}
