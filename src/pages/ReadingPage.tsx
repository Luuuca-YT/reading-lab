import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useRecorder, formatMs } from '../hooks/useRecorder';
import { articles } from '../db';
import type { Article } from '../db';

export function ReadingPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const { toast } = useToast();
  const recorder = useRecorder();
  const [article, setArticle] = useState<Article | null>(null);
  const [doneDisabled, setDoneDisabled] = useState(false);
  const startedRef = useRef(false);

  const order = Number(articleOrder);

  useEffect(() => {
    const articleId = session.articleIds[order - 1];
    if (articleId) {
      articles.getById(articleId).then((a) => setArticle(a ?? null));
    }
  }, [order, session.articleIds]);

  // Start recording on mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    recorder.start().then((blob) => {
      // Audio blob available after stop() — store reference for saving
      (window as any).__lastRecording = blob;
    });

    return () => {
      recorder.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show mic error as toast
  useEffect(() => {
    if (recorder.error) {
      toast(recorder.error, 'error');
    }
  }, [recorder.error, toast]);

  const markWord = useCallback((word: string) => {
    setSession({
      ...session,
      records: {
        ...session.records,
        [order]: {
          ...session.records[order],
          events: [
            ...session.records[order].events,
            { word, timestamp_ms: recorder.elapsedMs, event_type: 'misread' as const },
          ],
        },
      },
    });
  }, [session, order, recorder.elapsedMs, setSession]);

  const markPause = useCallback(() => {
    setSession({
      ...session,
      records: {
        ...session.records,
        [order]: {
          ...session.records[order],
          events: [
            ...session.records[order].events,
            { word: '(pause)', timestamp_ms: recorder.elapsedMs, event_type: 'pause' as const },
          ],
        },
      },
    });
    toast('Pause marked', 'info');
  }, [session, order, recorder.elapsedMs, setSession, toast]);

  function handleDone() {
    setDoneDisabled(true);
    recorder.stop();
    toast('Reading saved', 'success');
    navigate(`/session/${id}/feedback/${order}`);
  }

  const events = session.records[order]?.events ?? [];
  const statusColor =
    recorder.status === 'recording' ? 'bg-red-500 animate-pulse' :
    recorder.status === 'paused' ? 'bg-amber-500' :
    recorder.status === 'requesting' ? 'bg-blue-500 animate-pulse' : 'bg-bluebook-300';

  const statusLabel =
    recorder.status === 'recording' ? 'Recording' :
    recorder.status === 'paused' ? 'Paused' :
    recorder.status === 'requesting' ? 'Requesting mic...' : 'Ready';

  return (
    <Layout title={`Article ${order} of 3`} backTo={`/session/${id}/ready`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {/* Recording bar */}
        <div className="flex items-center justify-between rounded-2xl border border-bluebook-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`inline-block h-3 w-3 rounded-full ${statusColor}`} />
            <span className="text-sm font-medium text-bluebook-400 uppercase tracking-wide">
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-body font-mono tabular-nums text-bluebook-700">
              {formatMs(recorder.elapsedMs)}
            </span>
            <div className="flex gap-2">
              {recorder.status === 'recording' && (
                <Button variant="secondary" size="sm" onClick={recorder.pause}>
                  Pause
                </Button>
              )}
              {recorder.status === 'paused' && (
                <Button variant="secondary" size="sm" onClick={recorder.resume}>
                  Resume
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="rounded-2xl border border-bluebook-100 bg-white p-8">
          <h2 className="text-subhead text-bluebook-900 mb-6">{article?.title}</h2>
          <div className="text-body text-bluebook-800 leading-[2] tracking-wide">
            {article?.content.split(' ').map((word, i) => {
              const cleanWord = word.replace(/[.,!?"'()]/g, '');
              const isMarked = events.some(
                (e) => e.event_type === 'misread' && e.word === cleanWord
              );
              return (
                <span key={i}>
                  <span
                    onClick={() => markWord(cleanWord)}
                    className={`cursor-pointer rounded px-0.5 transition-colors ${
                      isMarked
                        ? 'bg-red-100 text-red-700 line-through decoration-red-400'
                        : 'hover:bg-bluebook-50'
                    }`}
                    title="Click to mark as misread"
                  >
                    {word}
                  </span>{' '}
                </span>
              );
            })}
          </div>
        </div>

        {/* Markers + counters */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={markPause}>
            ⏸ Mark Pause
          </Button>
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-500">
              {events.filter((e) => e.event_type === 'misread').length} misread
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">
              {events.filter((e) => e.event_type === 'pause').length} pauses
            </span>
          </div>
        </div>

        {/* Mic error banner */}
        {recorder.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span className="font-medium">Microphone Issue:</span> {recorder.error}
          </div>
        )}

        <Button size="lg" className="w-full" onClick={handleDone} disabled={doneDisabled}>
          I'm Done Reading
        </Button>
      </div>
    </Layout>
  );
}
