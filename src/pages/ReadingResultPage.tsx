import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { readingRecords, readingEvents } from '../db';
import type { AlignmentEntry, PauseEntry, AnalysisStats, ReadingEvent } from '../db/types';

const API = import.meta.env.VITE_API_URL || '';

export function ReadingResultPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const { toast } = useToast();

  const order = Number(articleOrder);
  const recordId = session.records[order]?.readingRecordId;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ASR analysis state
  const [alignment, setAlignment] = useState<AlignmentEntry[]>([]);
  const [pauses, setPauses] = useState<PauseEntry[]>([]);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [isMock, setIsMock] = useState(false);
  
  // Audio playback state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  // Local manual overrides state: wordIndex -> 'misread' | 'correct'
  const [manualOverrides, setManualOverrides] = useState<Record<number, 'misread' | 'correct'>>({});
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Load existing analysis on mount
  useEffect(() => {
    if (!recordId) {
      setError('Reading record ID not found in session context.');
      setLoading(false);
      return;
    }
    fetchAnalysisAndAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const fetchAnalysisAndAudio = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch audio recording using auth token
      fetchAudioBlob();

      // 2. Fetch analysis results
      const res = await readingRecords.getAnalysis(recordId!);
      if (res.analyzed) {
        setAlignment(res.alignment || []);
        setPauses(res.pauses || []);
        setStats(res.stats || null);
        setIsMock(!!res.isMock);

        // Load any existing manual overrides from reading_events
        const eventsList = await readingEvents.getByRecordId(recordId!);
        const overrides: Record<number, 'misread' | 'correct'> = {};
        eventsList.forEach((evt: ReadingEvent) => {
          if (evt.source === 'manual' && evt.word_index !== null && evt.word_index !== undefined) {
            overrides[evt.word_index] = evt.event_type === 'misread' ? 'misread' : 'correct';
          }
        });
        setManualOverrides(overrides);
      } else {
        // Not analyzed yet - auto trigger analysis!
        handleAnalyze();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reading analysis results.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAudioBlob = () => {
    if (!recordId) return;
    setAudioLoading(true);
    const token = localStorage.getItem('token');
    
    fetch(`${API}/api/records/${recordId}/audio`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      })
      .catch((e) => {
        console.error('Failed to load audio blob:', e);
        toast('Failed to load recording audio', 'error');
      })
      .finally(() => {
        setAudioLoading(false);
      });
  };

  // Clean up audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Trigger/Re-run Groq Whisper ASR analysis
  const handleAnalyze = async () => {
    if (!recordId) return;
    setAnalyzing(true);
    setError(null);
    try {
      toast('Sending recording to Groq Whisper ASR...', 'info');
      const res = await readingRecords.analyze(recordId);
      if (res.success || res.alignment) {
        setAlignment(res.alignment || []);
        setPauses(res.pauses || []);
        setStats(res.stats || null);
        setIsMock(!!res.isMock);
        setManualOverrides({}); // reset manual overrides on re-analysis
        toast('Analysis completed successfully!', 'success');
      } else {
        throw new Error(res.error || 'ASR analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'ASR analysis failed. Please verify GROQ_API_KEY is configured.');
      toast(err.message || 'ASR analysis failed', 'error');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  // Toggle manual misread override when a word is clicked
  const handleWordClick = (wordIndex: number) => {
    // Determine the current state of this word (considering alignment + overrides)
    const alignItem = alignment.find((e) => e.originalIndex === wordIndex);
    if (!alignItem) return;

    const currentType = manualOverrides[wordIndex] 
      ? (manualOverrides[wordIndex] === 'misread' ? 'substitution' : 'match')
      : alignItem.type;

    const isCurrentlyMisread = currentType === 'substitution' || currentType === 'deletion';
    const newOverride: 'misread' | 'correct' = isCurrentlyMisread ? 'correct' : 'misread';

    const updatedOverrides: Record<number, 'misread' | 'correct'> = { ...manualOverrides, [wordIndex]: newOverride };
    setManualOverrides(updatedOverrides);

    // Save the manual event correction to the database in real-time
    saveManualOverrides(updatedOverrides);
  };

  const saveManualOverrides = async (currentOverrides: Record<number, 'misread' | 'correct'>) => {
    if (!recordId) return;
    setSavingOverrides(true);
    try {
      // Reconstruct the array of manual events
      const eventsToSave = Object.entries(currentOverrides).map(([idxStr, type]) => {
        const idx = Number(idxStr);
        const alignItem = alignment.find((e) => e.originalIndex === idx);
        return {
          reading_record_id: recordId,
          word: alignItem?.originalWord || '',
          timestamp_ms: alignItem?.start ? Math.round(alignItem.start * 1000) : 0,
          event_type: type === 'misread' ? ('misread' as const) : ('correct' as const),
          word_index: idx,
          source: 'manual' as const,
        };
      });

      // Save events to server
      await readingEvents.batchCreate(eventsToSave);
    } catch (err) {
      console.error('Failed to save manual overrides:', err);
      toast('Failed to save correction', 'error');
    } finally {
      setSavingOverrides(false);
    }
  };

  // Dynamically compute alignment and statistics incorporating overrides
  const effectiveAnalysis = useMemo(() => {
    if (alignment.length === 0) return null;

    const adjustedAlignment = alignment.map((item) => {
      if (item.originalIndex !== null && manualOverrides[item.originalIndex] !== undefined) {
        const override = manualOverrides[item.originalIndex];
        return {
          ...item,
          type: (override === 'misread' ? 'substitution' : 'match') as 'match' | 'substitution' | 'deletion' | 'insertion',
          manual: true,
        };
      }
      return item;
    });

    const totalWords = adjustedAlignment.filter((e) => e.originalIndex !== null).length;
    const correctWords = adjustedAlignment.filter((e) => e.originalIndex !== null && e.type === 'match').length;
    const misreadWords = adjustedAlignment.filter((e) => e.originalIndex !== null && e.type === 'substitution').length;
    const skippedWords = adjustedAlignment.filter((e) => e.originalIndex !== null && e.type === 'deletion').length;
    
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

    return {
      alignment: adjustedAlignment,
      stats: {
        totalWords,
        correctWords,
        misreadWords,
        skippedWords,
        accuracy,
      },
    };
  }, [alignment, manualOverrides]);

  const handleContinue = () => {
    // Sync final stats to session context to preserve manually corrected events
    if (effectiveAnalysis) {
      // Collect all active events (misread and pause)
      const finalEvents: { word: string; timestamp_ms: number; event_type: 'misread' | 'pause' }[] = [];
      
      effectiveAnalysis.alignment.forEach((item) => {
        if (item.type === 'substitution' || item.type === 'deletion') {
          finalEvents.push({
            word: item.originalWord || '',
            timestamp_ms: item.start ? Math.round(item.start * 1000) : 0,
            event_type: 'misread',
          });
        }
      });

      pauses.forEach((p) => {
        finalEvents.push({
          word: p.afterWord || '',
          timestamp_ms: Math.round(p.startSec * 1000),
          event_type: 'pause',
        });
      });

      setSession({
        ...session,
        records: {
          ...session.records,
          [order]: {
            ...session.records[order],
            events: finalEvents,
          },
        },
      });
    }

    navigate(`/session/${id}/feedback/${order}`);
  };

  if (loading) {
    return (
      <Layout title="Speech Assessment Results" backTo={`/session/${id}/ready`}>
        <PageSpinner />
      </Layout>
    );
  }

  if (analyzing) {
    return (
      <Layout title="Speech Assessment Results">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-bluebook-100 border-t-bluebook-600"></div>
            <span className="absolute text-2xl">🎙️</span>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-bluebook-900">AI Speech Assessment in progress</h2>
            <p className="text-sm text-bluebook-500">We are transcribing your audio and aligning it using Groq Whisper v3...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Assessment Error" backTo={`/session/${id}/ready`}>
        <div className="mx-auto max-w-xl text-center py-16 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-bluebook-900">ASR Analysis Failed</h2>
            <p className="text-body text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-mono text-sm leading-relaxed">{error}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={fetchAnalysisAndAudio}>Retry Connection</Button>
            <Button onClick={handleAnalyze}>Trigger ASR Analysis</Button>
            <Button variant="ghost" onClick={handleContinue}>Skip to Feedback</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStats = effectiveAnalysis?.stats || stats;
  const currentAlignment = effectiveAnalysis?.alignment || alignment;

  // Circular progress math
  const accuracyVal = currentStats?.accuracy || 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracyVal / 100) * circumference;

  return (
    <Layout title={`Assessment Result — Article ${order} of 3`} backTo={`/session/${id}/ready`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
        
        {/* Demo Mode Notice Banner */}
        {isMock && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm flex items-start gap-3 animate-fade-in">
            <span className="text-2xl leading-none">⚠️</span>
            <div className="space-y-1">
              <p className="font-bold text-amber-900 text-base">Running in Demo / Fallback Mode</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                We detected that no valid <code>GROQ_API_KEY</code> or <code>OPENAI_API_KEY</code> is configured in your <code>.env</code> file (or your key returned an authentication error). 
                To showcase the interactive layout, we generated a simulated speech assessment with realistic pronunciation mistakes and hesitations.
              </p>
              <p className="text-xs font-semibold text-amber-950 mt-2">
                👉 Enter your actual API key in the <code>.env</code> file, then click "Re-run ASR Analysis" below to run real voice-recognition!
              </p>
            </div>
          </div>
        )}

        {/* Stats Header Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center rounded-2xl border border-bluebook-100 bg-white p-6 shadow-sm">
          
          {/* Circular Accuracy Progress */}
          <div className="flex items-center gap-4 justify-center md:justify-start md:border-r border-bluebook-50 pr-6">
            <div className="relative flex items-center justify-center">
              <svg className="h-20 w-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="#F3F4F6"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={accuracyVal >= 85 ? '#10B981' : accuracyVal >= 60 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-bold text-bluebook-900">{accuracyVal}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-bluebook-400 uppercase tracking-wide">Accuracy</div>
              <div className="text-sm font-bold text-bluebook-800">
                {accuracyVal >= 85 ? 'Excellent!' : accuracyVal >= 60 ? 'Satisfactory' : 'Needs Practice'}
              </div>
            </div>
          </div>

          {/* Stat Box: Misread */}
          <div className="flex flex-col items-center py-2 md:border-r border-bluebook-50">
            <span className="text-xs font-semibold text-bluebook-400 uppercase tracking-wide mb-1">Misread / Skipped</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-red-600">{currentStats?.misreadWords || 0}</span>
              <span className="text-sm text-bluebook-400">/ {currentStats?.totalWords || 0}</span>
            </div>
          </div>

          {/* Stat Box: Pauses */}
          <div className="flex flex-col items-center py-2 md:border-r border-bluebook-50">
            <span className="text-xs font-semibold text-bluebook-400 uppercase tracking-wide mb-1">Hesitations</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-amber-600">{pauses.length}</span>
              <span className="text-sm text-bluebook-400">pauses</span>
            </div>
          </div>

          {/* Stat Box: Duration */}
          <div className="flex flex-col items-center py-2">
            <span className="text-xs font-semibold text-bluebook-400 uppercase tracking-wide mb-1">Tutor Corrections</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-bluebook-600">
                {Object.keys(manualOverrides).length}
              </span>
              <span className="text-xs text-bluebook-400">manual overrides</span>
            </div>
          </div>

        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Article Display Card (Main - Left 2/3) */}
          <div className="lg:col-span-2 rounded-2xl border border-bluebook-100 bg-white p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-bluebook-50 pb-4">
              <h2 className="text-xl font-bold text-bluebook-900">Aligned Article</h2>
              <div className="flex items-center gap-2 text-xs text-bluebook-400 font-medium">
                <span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-200"></span> Misread
                <span className="inline-block w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200"></span> Skipped
                <span className="inline-block w-2.5 h-2.5 rounded border-b-2 border-blue-500"></span> Manual Override
              </div>
            </div>

            <div className="text-lg md:text-xl text-bluebook-800 leading-[2.2] tracking-wide select-none">
              {currentAlignment.map((item, idx) => {
                if (item.originalIndex === null) return null; // hide insertions from main text flow

                // Check for pause event immediately preceding this original word index
                const precedingPause = pauses.find((p) => p.afterOriginalIndex === item.originalIndex! - 1);
                
                // Determine CSS style based on alignment category
                let highlightStyle = "hover:bg-bluebook-50 cursor-pointer rounded px-1 py-0.5 transition-all duration-150";
                let tooltipText = "Click to toggle manual correction";

                if (item.type === 'substitution') {
                  highlightStyle = "bg-red-100 text-red-700 font-semibold cursor-pointer rounded px-1 py-0.5 border border-red-200 hover:bg-red-200 transition-all duration-150";
                  tooltipText = item.asrWord ? `ASR heard: "${item.asrWord}" (Click to mark correct)` : `Click to mark correct`;
                } else if (item.type === 'deletion') {
                  highlightStyle = "bg-gray-100 text-gray-400 line-through cursor-pointer rounded px-1 py-0.5 border border-gray-200 hover:bg-gray-200 transition-all duration-150";
                  tooltipText = "Skipped word (Click to mark correct)";
                }

                // If manually modified, overlay blue underline style
                if (item.manual) {
                  highlightStyle += " border-b-2 border-blue-500 rounded-none decoration-blue-500 underline-offset-4";
                }

                return (
                  <span key={idx} className="relative inline-block mr-1.5 group">
                    {/* Preceding Pause Pill */}
                    {precedingPause && (
                      <span className="mx-1 inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 select-none animate-fade-in align-middle leading-none">
                        ⏸ {(precedingPause.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}

                    {/* Word Element with CSS Tooltip */}
                    <span
                      onClick={() => handleWordClick(item.originalIndex!)}
                      className={highlightStyle}
                    >
                      {item.originalWord}
                    </span>

                    {/* Custom tooltip box */}
                    <span className="absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-xs -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-normal text-white shadow-md transition-all duration-150 origin-bottom group-hover:scale-100">
                      {tooltipText}
                      <span className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900"></span>
                    </span>
                  </span>
                );
              })}

              {/* Check if last word has a pause following it */}
              {pauses.find((p) => p.afterOriginalIndex === (currentAlignment.filter((e) => e.originalIndex !== null).length - 1)) && (
                <span className="mx-1 inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 select-none align-middle leading-none">
                  ⏸ {(pauses.find((p) => p.afterOriginalIndex === (currentAlignment.filter((e) => e.originalIndex !== null).length - 1))!.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Audio Player and Instructions Card (Right 1/3) */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            
            {/* Audio Player Card */}
            <div className="rounded-2xl border border-bluebook-100 bg-white p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-bluebook-900 flex items-center gap-2">
                🔊 Reading Audio
              </h3>
              
              {audioLoading ? (
                <div className="py-4 flex justify-center text-sm text-bluebook-400">Loading audio recording...</div>
              ) : audioUrl ? (
                <div className="space-y-2">
                  <audio src={audioUrl} controls className="w-full bg-bluebook-50 rounded-xl" />
                  <p className="text-xs text-bluebook-400 text-center">Listen to the student's recording while reviewing</p>
                </div>
              ) : (
                <div className="py-6 border border-dashed border-bluebook-200 rounded-xl flex flex-col items-center justify-center gap-2 text-center px-4">
                  <span className="text-xl">📭</span>
                  <span className="text-xs font-medium text-bluebook-400">No audio recording file loaded.</span>
                </div>
              )}
            </div>

            {/* Instruction Guide Card */}
            <div className="rounded-2xl border border-bluebook-100 bg-gradient-to-br from-bluebook-50/50 to-white p-6 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-bluebook-900 flex items-center gap-2">
                ✍️ Tutor Correction Guide
              </h3>
              <ul className="text-xs text-bluebook-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li>ASR analysis highlights likely <strong>pronunciation mistakes</strong> <span className="text-red-600 font-semibold bg-red-50 px-1 rounded">in red</span>.</li>
                <li>ASR highlights <strong>skipped words</strong> <span className="text-gray-500 line-through bg-gray-50 px-1 rounded">in gray</span>.</li>
                <li>ASR displays detected <strong>hesitations</strong> using pause pills <span className="text-amber-700 bg-amber-50 border border-amber-100 px-1 rounded font-mono">⏸ 2.0s</span>.</li>
                <li><strong>Manual Adjustment:</strong> Click any word to toggle its assessment state. A blue underline <span className="border-b-2 border-blue-500 font-medium">like this</span> denotes a manual override.</li>
                <li>Manual overrides will be saved immediately to the database and reflected in the student's progress charts.</li>
              </ul>
              
              {savingOverrides && (
                <div className="mt-2 text-xs text-bluebook-500 flex items-center gap-1.5 justify-end">
                  <span className="h-2 w-2 rounded-full bg-bluebook-500 animate-ping"></span>
                  Saving corrections...
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Action Bottom Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-bluebook-100 pt-6">
          <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
            🔄 Re-run ASR Analysis
          </Button>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate(`/session/${id}/ready`)}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleContinue} className="px-10">
              Continue to Feedback →
            </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
