import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { readingRecords, readingEvents } from '../db';
import type { AlignmentEntry, PauseEntry, AnalysisStats, ReadingEvent } from '../db/types';
import { CatAvatar, cats } from '../components/CatAvatar';
import { synth } from '../utils/audio';

const API = import.meta.env.VITE_API_URL || '';

interface RealmConfig {
  id: string;
  name: string;
  emoji: string;
  bgGrad: string;
  glowColor: string;
  particleType: 'space' | 'jungle' | 'ocean' | 'library';
  textColor: string;
}

const realms: RealmConfig[] = [
  {
    id: 'space',
    name: 'Cosmic Nebula',
    emoji: '🚀',
    bgGrad: 'from-indigo-950 via-slate-900 to-indigo-900 text-slate-100',
    glowColor: 'bg-indigo-500',
    particleType: 'space',
    textColor: 'text-indigo-400'
  },
  {
    id: 'jungle',
    name: 'Emerald Jungle',
    emoji: '🌴',
    bgGrad: 'from-emerald-950 via-teal-950 to-stone-900 text-stone-100',
    glowColor: 'bg-emerald-500',
    particleType: 'jungle',
    textColor: 'text-emerald-400'
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    bgGrad: 'from-cyan-950 via-blue-950 to-sky-900 text-sky-100',
    glowColor: 'bg-cyan-500',
    particleType: 'ocean',
    textColor: 'text-cyan-400'
  },
  {
    id: 'library',
    name: 'Starry Library',
    emoji: '🏰',
    bgGrad: 'from-purple-950 via-violet-900 to-amber-950 text-amber-100',
    glowColor: 'bg-amber-500',
    particleType: 'library',
    textColor: 'text-amber-400'
  }
];

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

  const selectedCatId = session.selectedCatId || 'leo';
  const selectedThemeId = session.selectedThemeId || 'space';
  const activeCostume = session.activeCostume || null;

  const activeRealm = useMemo(() => {
    return realms.find(r => r.id === selectedThemeId) || realms[0];
  }, [selectedThemeId]);

  const activeCat = useMemo(() => {
    return cats.find(c => c.id === selectedCatId) || cats[0];
  }, [selectedCatId]);

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
          if (evt.source === 'manual' && evt.word_index !== null && evt.word_index !== undefined && evt.event_type === 'misread') {
            overrides[evt.word_index] = 'misread';
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

        // Reload manual marks from reading (preserved across analysis since they have source='manual')
        try {
          const eventsList = await readingEvents.getByRecordId(recordId);
          const overrides: Record<number, 'misread' | 'correct'> = {};
          eventsList.forEach((evt: any) => {
            if (evt.source === 'manual' && evt.word_index !== null && evt.word_index !== undefined && evt.event_type === 'misread') {
              overrides[evt.word_index] = 'misread';
            }
          });
          setManualOverrides(overrides);
        } catch (e) {
          setManualOverrides({});
        }

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

  // Toggle manual override when a word is clicked:
  //   no override → mark misread
  //   has override → remove (revert to ASR)
  const handleWordClick = (wordIndex: number) => {
    const alignItem = alignment.find((e) => e.originalIndex === wordIndex);
    if (!alignItem) return;

    if (manualOverrides[wordIndex] !== undefined) {
      // Has override — remove it (revert to ASR)
      const updatedOverrides: Record<number, 'misread' | 'correct'> = { ...manualOverrides };
      delete updatedOverrides[wordIndex];
      setManualOverrides(updatedOverrides);
      saveManualOverrides(updatedOverrides);
    } else {
      // No override — mark as misread
      const updatedOverrides: Record<number, 'misread' | 'correct'> = { ...manualOverrides, [wordIndex]: 'misread' };
      setManualOverrides(updatedOverrides);
      saveManualOverrides(updatedOverrides);
    }
  };

  // Context menu for analysis page
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; wordIndex: number; word: string } | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setContextMenu(null); }
    if (contextMenu) { window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }
  }, [contextMenu]);

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

  const getReactionDialogue = (catId: string, accuracy: number): string => {
    const dialogues: Record<string, { high: string; mid: string; low: string }> = {
      leo: {
        high: "WHOA! That was stellar! You read with 100% rocket power! Absolutely pawsome! 🚀🐾",
        mid: "Nice job! We cruised through those words smoothly. Let's keep scanning the stars! 🪐😺",
        low: "A little space turbulence! But no worries, every space cadet gets better with practice! ☄️🦁"
      },
      luna: {
        high: "Positively flawless! Your reading is elegant and bright like a stellar supernova, darling! 💎👸",
        mid: "Quite lovely! A very respectable performance. A royal applause for you! 👑✨",
        low: "Mmm, a slight stumble. But a true princess never gives up. Let's polish our pronunciation! 💅🎀"
      },
      milo: {
        high: "OH MY GOSH! You read that as easily as eating a giant double-chocolate donut! Delicious! 🍩😻",
        mid: "So sweet! A super tasty reading. I think this deserves a big cookie reward! 🍪🐾",
        low: "A little bit crumbly, but even a dropped cupcake still tastes sweet! Let's try again! 🧁😸"
      },
      shadow: {
        high: "A legendary spell cast! The ancient wisdom of the reading runes is fully unlocked! 🔮✨",
        mid: "The mental mana flows steadily. Your progress is aligned with the cosmic ley lines! 🧙‍♂️🔮",
        low: "The spell fizzled slightly. But patience, apprentice! Magic takes time and dedication to master! 🕯️🐈‍⬛"
      }
    };
    
    const cat = dialogues[catId] || dialogues.leo;
    if (accuracy >= 85) return cat.high;
    if (accuracy >= 60) return cat.mid;
    return cat.low;
  };

  const renderThemeParticles = (type: 'space' | 'jungle' | 'ocean' | 'library') => {
    if (type === 'jungle') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-float-leaf1" style={{ left: '15%', top: '-10%', animationDelay: '0s' }}>🍃</span>
          <span className="absolute text-xl animate-float-leaf2" style={{ left: '45%', top: '-10%', animationDelay: '1.2s' }}>🍂</span>
          <span className="absolute text-2xl animate-float-leaf3" style={{ left: '75%', top: '-10%', animationDelay: '0.6s' }}>🍁</span>
          <span className="absolute text-yellow-300 text-lg animate-pulse" style={{ left: '25%', top: '40%', animationDelay: '0.2s' }}>✨</span>
          <span className="absolute text-yellow-200 text-xl animate-pulse" style={{ right: '20%', bottom: '30%', animationDelay: '0.8s' }}>✨</span>
          <span className="absolute text-yellow-300 text-sm animate-pulse" style={{ left: '50%', bottom: '15%', animationDelay: '1.5s' }}>✨</span>
        </div>
      );
    }
    
    if (type === 'ocean') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-float-bubble1" style={{ left: '20%', bottom: '-10%', animationDelay: '0s' }}>🫧</span>
          <span className="absolute text-3xl animate-float-bubble2" style={{ left: '50%', bottom: '-10%', animationDelay: '0.8s' }}>🫧</span>
          <span className="absolute text-xl animate-float-bubble3" style={{ left: '80%', bottom: '-10%', animationDelay: '0.4s' }}>🫧</span>
          <span className="absolute text-2xl animate-swim-fish" style={{ right: '15%', top: '30%', animationDelay: '1s' }}>🐠</span>
          <span className="absolute text-3xl animate-swim-fish" style={{ left: '10%', top: '60%', animationDelay: '2s' }}>🐙</span>
        </div>
      );
    }

    if (type === 'library') {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute text-2xl animate-spin-star" style={{ left: '15%', top: '15%', animationDelay: '0s' }}>⭐</span>
          <span className="absolute text-3xl animate-spin-star" style={{ right: '15%', top: '25%', animationDelay: '0.5s' }}>✨</span>
          <span className="absolute text-2xl animate-spin-star" style={{ left: '40%', bottom: '15%', animationDelay: '1.2s' }}>📚</span>
          <span className="absolute text-xl animate-bounce" style={{ left: '70%', top: '40%', animationDelay: '0.2s' }}>📖</span>
          <span className="absolute text-amber-300 font-bold text-lg animate-pulse" style={{ left: '25%', top: '65%', animationDelay: '0.8s' }}>🔤</span>
          <span className="absolute text-amber-200 font-bold text-xl animate-pulse" style={{ right: '35%', bottom: '35%', animationDelay: '1.8s' }}>🔮</span>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute text-xl animate-float-meteor1" style={{ left: '15%', bottom: '-10%', animationDelay: '0s' }}>☄️</span>
        <span className="absolute text-2xl animate-float-meteor2" style={{ left: '45%', bottom: '-10%', animationDelay: '0.7s' }}>🪐</span>
        <span className="absolute text-3xl animate-float-meteor3" style={{ right: '15%', bottom: '-10%', animationDelay: '1.4s' }}>🛸</span>
        <span className="absolute text-indigo-300 text-sm animate-pulse" style={{ left: '30%', top: '20%', animationDelay: '0.2s' }}>✨</span>
        <span className="absolute text-purple-300 text-xs animate-pulse" style={{ right: '25%', top: '40%', animationDelay: '0.9s' }}>✨</span>
        <span className="absolute text-sky-200 text-md animate-pulse" style={{ left: '60%', bottom: '25%', animationDelay: '1.5s' }}>✨</span>
      </div>
    );
  };

  const styles = (
    <style>{`
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(1deg); }
      }
      @keyframes breathe-slow {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes pop-bounce {
        0% { transform: scale(0.85) translateY(10px); opacity: 0; }
        70% { transform: scale(1.03) translateY(-3px); }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      @keyframes float-meteor-anim {
        0% { transform: translateY(120px) rotate(0deg) scale(0.8); opacity: 0; }
        10% { opacity: 0.5; }
        90% { opacity: 0.5; }
        100% { transform: translateY(-120px) rotate(360deg) scale(1.1); opacity: 0; }
      }
      @keyframes float-leaf-anim {
        0% { transform: translateY(-30px) translateX(0) rotate(0deg); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translateY(220px) translateX(40px) rotate(240deg); opacity: 0; }
      }
      @keyframes float-bubble-anim {
        0% { transform: translateY(120px) scale(0.6); opacity: 0; }
        15% { opacity: 0.8; }
        85% { opacity: 0.8; }
        100% { transform: translateY(-120px) scale(1.1); opacity: 0; }
      }
      @keyframes swim-fish-anim {
        0%, 100% { transform: translateX(0) translateY(0) scaleX(1); }
        49% { transform: translateX(30px) translateY(-8px) scaleX(1); }
        50% { transform: translateX(30px) translateY(-8px) scaleX(-1); }
        99% { transform: translateX(0) translateY(0) scaleX(-1); }
      }
      @keyframes spin-star-item {
        0% { transform: scale(0.5) rotate(0deg); opacity: 0; }
        50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
        100% { transform: scale(0.6) rotate(360deg); opacity: 0; }
      }
      .animate-float-slow { animation: float-slow 5s ease-in-out infinite; }
      .animate-breathe-slow { animation: breathe-slow 3.5s ease-in-out infinite; }
      .animate-pop-bounce { animation: pop-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      
      .animate-float-meteor1 { animation: float-meteor-anim 3.5s ease-in-out infinite; }
      .animate-float-meteor2 { animation: float-meteor-anim 4.2s ease-in-out infinite 0.8s; }
      .animate-float-meteor3 { animation: float-meteor-anim 3.8s ease-in-out infinite 1.6s; }
      
      .animate-float-leaf1 { animation: float-leaf-anim 4.5s linear infinite; }
      .animate-float-leaf2 { animation: float-leaf-anim 5.2s linear infinite 1.2s; }
      .animate-float-leaf3 { animation: float-leaf-anim 4.8s linear infinite 2.4s; }
      
      .animate-float-bubble1 { animation: float-bubble-anim 3.2s ease-in-out infinite; }
      .animate-float-bubble2 { animation: float-bubble-anim 4s ease-in-out infinite 0.7s; }
      .animate-float-bubble3 { animation: float-bubble-anim 3.6s ease-in-out infinite 1.5s; }
      .animate-swim-fish { animation: swim-fish-anim 6s ease-in-out infinite; }
      .animate-spin-star { animation: spin-star-item 2.5s ease-in-out infinite; }
    `}</style>
  );

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
        {styles}
        <div className={`mx-auto max-w-5xl rounded-3xl p-8 border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden flex h-[60vh] flex-col items-center justify-center gap-6 shadow-2xl`}>
          {renderThemeParticles(activeRealm.particleType)}
          <div className="relative flex items-center justify-center z-10">
            <div className="h-24 w-24 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
            <span className="absolute text-4xl animate-bounce">🎙️</span>
          </div>
          <div className="text-center space-y-3 z-10">
            <h2 className="text-2xl font-black text-white">AI Assessment in Progress!</h2>
            <p className="text-sm text-white/70 max-w-md">Aligning recorded frequencies and finding speech errors using Groq Whisper v3...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Assessment Error" backTo={`/session/${id}/ready`}>
        {styles}
        <div className={`mx-auto max-w-3xl rounded-3xl p-8 border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden text-center py-16 space-y-6 shadow-2xl`}>
          {renderThemeParticles(activeRealm.particleType)}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/25 border border-red-500/40 text-4xl animate-bounce z-10">⚠️</div>
          <div className="space-y-3 z-10 relative">
            <h2 className="text-2xl font-black text-white">ASR Analysis Failed</h2>
            <p className="text-body text-red-200 bg-red-950/50 p-4 rounded-xl border border-red-500/20 font-mono text-sm leading-relaxed max-w-xl mx-auto">{error}</p>
          </div>
          <div className="flex gap-4 justify-center relative z-10">
            <Button variant="secondary" onClick={fetchAnalysisAndAudio} className="bg-white/10 hover:bg-white/20 text-white border-white/10">Retry Connection</Button>
            <Button onClick={handleAnalyze} className="bg-amber-500 hover:bg-amber-600 text-white font-bold border-amber-600 shadow-md">Trigger ASR Analysis</Button>
            <Button variant="ghost" onClick={handleContinue} className="text-white/60 hover:text-white">Skip to Feedback</Button>
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

  // Accents matching realm theme
  const accentGlow = activeRealm.glowColor;
  const accuracyColor = accuracyVal >= 85 ? '#10B981' : accuracyVal >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <Layout title={`Assessment Result — Article ${order} of 3`} backTo={`/session/${id}/ready`}>
      {styles}
      
      {/* Gamified Main Container Card wrapping the whole page elements in chosen Realm */}
      <div className={`mx-auto flex max-w-5xl flex-col gap-6 select-none p-6 md:p-8 shadow-2xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} rounded-3xl relative overflow-hidden z-10`}>
        
        {/* Floating particles */}
        {renderThemeParticles(activeRealm.particleType)}

        {/* Dynamic Realm banner & Student header */}
        <div className="flex justify-between items-center z-10 px-1 border-b border-white/10 pb-4">
          <div className="inline-block rounded-full bg-white/10 px-5 py-2 text-xs font-black text-white shadow-sm backdrop-blur border border-white/10 uppercase tracking-widest">
            {session.studentName} · Realm Assessment
          </div>
          <span className="text-xs font-black text-white/60 tracking-wider">
            THEME: {activeRealm.name} {activeRealm.emoji}
          </span>
        </div>

        {/* Demo Mode Notice Banner */}
        {isMock && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/60 backdrop-blur-md p-5 text-sm text-amber-200 shadow-xl flex items-start gap-3 animate-fade-in z-10">
            <span className="text-2xl leading-none">⚠️</span>
            <div className="space-y-1">
              <p className="font-bold text-amber-300 text-base">Running in Demo / Fallback Mode</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                We detected that no valid <code>GROQ_API_KEY</code> is configured in your environment. We simulated a realistic voice-recognition trial complete with hesitations and pronunciation triggers.
              </p>
              <p className="text-xs font-bold text-amber-300 mt-1">
                👉 Provide an API key in your <code>.env</code> file, then click "Re-run ASR Analysis" below to run full voice AI processing!
              </p>
            </div>
          </div>
        )}

        {/* Stats Header Bar (Glassmorphic Dark Mode vibe) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center rounded-2xl border border-white/15 bg-slate-900/65 backdrop-blur-md p-6 shadow-xl z-10">
          
          {/* Circular Accuracy Progress */}
          <div className="flex items-center gap-4 justify-center md:justify-start md:border-r border-white/10 pr-4">
            <div className="relative flex items-center justify-center">
              <svg className="h-20 w-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6.5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={accuracyColor}
                  strokeWidth="6.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-white">{accuracyVal}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">Accuracy</div>
              <div className="text-sm font-black text-white">
                {accuracyVal >= 85 ? 'Excellent! 🌟' : accuracyVal >= 60 ? 'Satisfactory 👍' : 'Needs Practice 💪'}
              </div>
            </div>
          </div>

          {/* Stat Box: Misread */}
          <div className="flex flex-col items-center py-1 md:border-r border-white/10">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5">Misread / Skipped</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-red-400">{currentStats?.misreadWords || 0}</span>
              <span className="text-xs text-white/60">/ {currentStats?.totalWords || 0} words</span>
            </div>
          </div>

          {/* Stat Box: Pauses */}
          <div className="flex flex-col items-center py-1 md:border-r border-white/10">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5">Hesitations</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-400">{pauses.length}</span>
              <span className="text-xs text-white/60">pause pills</span>
            </div>
          </div>

          {/* Stat Box: Tutor Corrections */}
          <div className="flex flex-col items-center py-1">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1.5">Tutor Corrections</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-sky-400">
                {Object.keys(manualOverrides).length}
              </span>
              <span className="text-xs text-white/60">manual adjustments</span>
            </div>
          </div>

        </div>

        {/* Main Content Double Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-10">
          
          {/* Article Display Card (Main - Left 2/3) - Ultra Glassmorphic Light */}
          <div className="lg:col-span-2 rounded-2xl border border-white/20 bg-white/95 text-slate-800 p-6 md:p-8 shadow-xl backdrop-blur-md flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">Aligned Article Text</h2>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-200"></span> Misread</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200"></span> Skipped</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2 rounded-none border-b-2 border-blue-500"></span> Override</span>
              </div>
            </div>

            <div className="text-lg md:text-xl text-slate-800 leading-[2.4] tracking-wide select-none">
              {currentAlignment.map((item, idx) => {
                if (item.originalIndex === null) return null; // hide insertions from main flow

                // Check for pause event immediately preceding this word
                const precedingPause = pauses.find((p) => p.afterOriginalIndex === item.originalIndex! - 1);
                
                // Determine style based on category
                let highlightStyle = "hover:bg-slate-100 cursor-pointer rounded px-1.5 py-0.5 transition-all duration-150 relative inline-block";
                let tooltipText = "Click to mark misread or skip";

                if (item.type === 'substitution') {
                  highlightStyle = "bg-red-100 text-red-700 font-bold cursor-pointer rounded px-1.5 py-0.5 border border-red-200 hover:bg-red-200 transition-all duration-150";
                  tooltipText = item.asrWord ? `ASR heard: "${item.asrWord}"` : `Marked as misread`;
                } else if (item.type === 'deletion') {
                  highlightStyle = "bg-slate-150 text-slate-400 line-through cursor-pointer rounded px-1.5 py-0.5 border border-slate-200 hover:bg-slate-250 transition-all duration-150";
                  tooltipText = "Skipped word";
                }

                // If manually modified overlay blue underline
                if (item.manual) {
                  highlightStyle += " border-b-4 border-sky-500 rounded-none decoration-sky-500 underline-offset-4 bg-sky-50/50 text-sky-800 font-extrabold";
                  tooltipText += " (Manual override)";
                }

                return (
                  <span key={idx} className="relative inline-block mr-1 group">
                    {/* Preceding Pause Pill */}
                    {precedingPause && (
                      <span className="mx-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-black text-amber-800 select-none animate-fade-in align-middle leading-none">
                        ⏸ {(precedingPause.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}

                    {/* Word Element */}
                    <span
                      onClick={() => {
                        synth.playHover();
                        handleWordClick(item.originalIndex!);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, wordIndex: item.originalIndex!, word: item.originalWord! });
                      }}
                      className={highlightStyle}
                    >
                      {item.originalWord}
                    </span>

                    {/* Interactive Tooltip bubble */}
                    <span className="absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-xs -translate-x-1/2 scale-0 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xl transition-all duration-150 origin-bottom group-hover:scale-100 select-none">
                      {tooltipText}
                      <span className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900"></span>
                    </span>
                  </span>
                );
              })}

              {/* Last word trailing pause */}
              {pauses.find((p) => p.afterOriginalIndex === (currentAlignment.filter((e) => e.originalIndex !== null).length - 1)) && (
                <span className="mx-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-black text-amber-800 select-none align-middle leading-none">
                  ⏸ {(pauses.find((p) => p.afterOriginalIndex === (currentAlignment.filter((e) => e.originalIndex !== null).length - 1))!.durationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Right Column (Mascot Response + Audio + Instructions) */}
          <div className="flex flex-col gap-5 lg:col-span-1">
            
            {/* 1. Glassmorphic Cat Avatar Celebration Speech Box */}
            <div className="bg-slate-900/60 border border-white/10 text-white backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-25 filter blur-xl ${accentGlow}`} />
              
              {/* Cat speech bubble */}
              <div className="relative bg-white/95 border border-slate-200 rounded-xl p-3 shadow-lg text-slate-800 font-extrabold text-[12px] md:text-[13px] text-center w-full leading-relaxed animate-pop-bounce mb-5 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 z-10">
                {getReactionDialogue(activeCat.id, accuracyVal)}
              </div>

              {/* Companion Circle */}
              <div className="relative w-32 h-32 rounded-full bg-white/15 border-4 border-white/20 shadow-2xl flex items-center justify-center animate-float-slow z-10 cursor-pointer" onClick={() => synth.playMeow()}>
                <div className="absolute inset-3 rounded-full bg-white/5 filter blur(4px)" />
                <CatAvatar 
                  catId={activeCat.id} 
                  expression={accuracyVal >= 85 ? 'excited' : accuracyVal >= 60 ? 'happy' : 'sad'}
                  activeCostume={activeCostume}
                  className="w-full h-full p-1.5"
                />
              </div>

              <div className="mt-3 text-xs font-black tracking-widest text-white/90 uppercase">
                {activeCat.name} {activeCostume ? `· ${activeCostume.toUpperCase()}` : ''}
              </div>
            </div>

            {/* 2. Audio Player Card */}
            <div className="rounded-2xl border border-white/20 bg-white/95 p-5 shadow-xl flex flex-col gap-4 text-slate-800">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                🔊 Student Reading Audio
              </h3>
              
              {audioLoading ? (
                <div className="py-4 flex justify-center text-xs text-slate-400">Loading audio recording...</div>
              ) : audioUrl ? (
                <div className="space-y-2">
                  <audio src={audioUrl} controls className="w-full bg-slate-100 rounded-xl" />
                  <p className="text-[10px] text-slate-400 text-center font-bold">Listen to review hesitations and pauses</p>
                </div>
              ) : (
                <div className="py-6 border border-dashed border-slate-350 rounded-xl flex flex-col items-center justify-center gap-2 text-center px-4">
                  <span className="text-2xl">📭</span>
                  <span className="text-xs font-bold text-slate-400">No recording audio loaded.</span>
                </div>
              )}
            </div>

            {/* 3. Tutor Guide Card */}
            <div className="rounded-2xl border border-white/15 bg-slate-950/40 p-5 shadow-xl flex flex-col gap-3 text-white/95">
              <h3 className="font-black flex items-center gap-2 text-sm">
                ✍️ Tutor Correction Guide
              </h3>
              <ul className="text-[11px] space-y-2 list-disc pl-4 leading-relaxed opacity-90 font-medium">
                <li>ASR flags misread words <span className="text-red-300 font-bold bg-red-950/30 px-1 rounded">in red</span>.</li>
                <li>ASR flags skipped words <span className="text-slate-300 line-through bg-slate-800/40 px-1 rounded">in gray</span>.</li>
                <li>Pause pills show natural hesitations.</li>
                <li><strong>Manual Adjustment:</strong> Click any word to toggle. A blue underline shows a manual override.</li>
              </ul>
              
              {savingOverrides && (
                <div className="mt-1 text-[10px] text-sky-300 flex items-center gap-1.5 justify-end font-bold">
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping"></span>
                  Saving corrections...
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Action Bottom Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-white/15 pt-6 z-10">
          <Button variant="secondary" onClick={handleAnalyze} disabled={analyzing} className="bg-white/10 hover:bg-white/20 text-white border-white/10 font-bold">
            🔄 Re-run ASR Analysis
          </Button>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate(`/session/${id}/ready`)} className="text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border-white/10 font-bold">
              Cancel
            </Button>
            <Button size="lg" onClick={handleContinue} className="px-10 bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-500/20 font-black tracking-wide">
              Continue to Feedback →
            </Button>
          </div>
        </div>

      </div>

      {/* Right-click context menu for word override */}
      {contextMenu && (() => {
        const hasOverride = manualOverrides[contextMenu.wordIndex] !== undefined;
        const currentOverride = manualOverrides[contextMenu.wordIndex];
        return (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div className="fixed z-50 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl py-1.5 min-w-[200px] backdrop-blur-xl overflow-hidden" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <p className="px-4 py-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
              "{contextMenu.word}"
            </p>
            <button
              onClick={() => {
                const updated: Record<number, 'misread' | 'correct'> = { ...manualOverrides, [contextMenu.wordIndex]: 'misread' };
                setManualOverrides(updated); saveManualOverrides(updated); setContextMenu(null);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors ${currentOverride === 'misread' ? 'bg-red-500/10 text-red-200' : 'text-red-300 hover:bg-red-500/10 hover:text-red-200'}`}
            >
              🔥 {currentOverride === 'misread' ? '✓ Misread' : 'Mark as Misread'}
            </button>
            <button
              onClick={() => {
                const updated: Record<number, 'misread' | 'correct'> = { ...manualOverrides, [contextMenu.wordIndex]: 'correct' };
                setManualOverrides(updated); saveManualOverrides(updated); setContextMenu(null);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors ${currentOverride === 'correct' ? 'bg-emerald-500/10 text-emerald-200' : 'text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200'}`}
            >
              ✅ {currentOverride === 'correct' ? '✓ Correct' : 'Mark as Correct'}
            </button>
            {hasOverride && (
              <button
                onClick={() => {
                  const updated: Record<number, 'misread' | 'correct'> = { ...manualOverrides };
                  delete updated[contextMenu.wordIndex];
                  setManualOverrides(updated); saveManualOverrides(updated); setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-500/10 hover:text-slate-300 flex items-center gap-3 transition-colors border-t border-white/5"
              >
                ✕ Remove Override
              </button>
            )}
          </div>
        </>
        );
      })()}

    </Layout>
  );
}

