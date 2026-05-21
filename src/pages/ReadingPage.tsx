import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { useRecorder, formatMs } from '../hooks/useRecorder';
import { authFetch } from '../context/AuthContext';
import { articles, readingRecords, readingEvents } from '../db';
import type { Article } from '../db';
import { CatAvatar } from '../components/CatAvatar';
import { synth } from '../utils/audio';

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

export function ReadingPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const { toast } = useToast();
  const recorder = useRecorder();
  const [article, setArticle] = useState<Article | null>(null);
  const [doneDisabled, setDoneDisabled] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; wordIndex: number; word: string } | null>(null);
  const startedRef = useRef(false);
  const blobPromiseRef = useRef<Promise<{ blob: Blob; isSilent: boolean; maxVolume: number } | null> | null>(null);

  const order = Number(articleOrder);

  const selectedCatId = session.selectedCatId || 'leo';
  const selectedThemeId = session.selectedThemeId || 'space';
  const activeCostume = session.activeCostume || null;

  const activeRealm = useMemo(() => {
    return realms.find(r => r.id === selectedThemeId) || realms[0];
  }, [selectedThemeId]);

  // Mascot encourages reading state
  const mascotSpeech = useMemo(() => {
    if (recorder.status === 'recording') {
      return `Keep reading aloud — click any word to mark it as misread! 🎙️🐾`;
    }
    if (recorder.status === 'paused') {
      return `Paused! Take a deep breath and a sweet sip of water! 🥤😺`;
    }
    return `Click "Start" to begin our magical reading session! ✨🐾`;
  }, [recorder.status]);

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

    blobPromiseRef.current = recorder.start();

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

  // Close context menu on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setContextMenu(null); }
    if (contextMenu) { window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }
  }, [contextMenu]);

  const toggleWordMark = useCallback((word: string, wordIndex: number, eventType: 'misread' | 'pause') => {
    synth.playSelect();
    const currentEvents = session.records[order]?.events ?? [];
    const existingIdx = currentEvents.findIndex((e: any) => e.word_index === wordIndex);

    let newEvents;
    if (existingIdx !== -1 && currentEvents[existingIdx].event_type === eventType) {
      // Same type at same index — remove (unmark)
      newEvents = [...currentEvents];
      newEvents.splice(existingIdx, 1);
      if (eventType === 'pause') toast('Pause removed', 'info');
    } else if (existingIdx !== -1) {
      // Different type — replace
      newEvents = [...currentEvents];
      newEvents[existingIdx] = { word, word_index: wordIndex, timestamp_ms: recorder.elapsedMs, event_type: eventType };
      toast(eventType === 'pause' ? 'Changed to pause' : 'Changed to misread', 'info');
    } else {
      // Not marked — add
      newEvents = [...currentEvents, { word, word_index: wordIndex, timestamp_ms: recorder.elapsedMs, event_type: eventType }];
      if (eventType === 'pause') toast('Pause marked', 'info');
    }

    setSession({
      ...session,
      records: {
        ...session.records,
        [order]: {
          ...session.records[order],
          events: newEvents,
        },
      },
    });
  }, [session, order, recorder.elapsedMs, setSession, toast]);

  const markGlobalPause = useCallback(() => {
    synth.playHover();
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
    synth.playSuccess();
    setDoneDisabled(true);
    recorder.stop();

    // Save reading record and upload audio
    (async () => {
      try {
        // Create the reading record
        const record = await readingRecords.create({
          session_id: Number(id),
          article_id: session.articleIds[order - 1],
          start_time: new Date().toISOString(),
          end_time: null,
        });

        // Upload audio
        const recordData = await (blobPromiseRef.current ?? Promise.resolve(null));
        if (recordData && recordData.blob && recordData.blob.size > 0) {
          try {
            await authFetch(`/api/records/${record.id}/audio`, {
              method: 'POST',
              headers: {
                'Content-Type': recordData.blob.type,
                'X-Audio-Silent': String(recordData.isSilent),
              },
              body: recordData.blob,
            });
          } catch (err) {
            console.error('Audio upload failed:', err);
          }
        }

        // Sync manual marks (misread/pause) to DB so they appear in analysis
        const manualEvents = session.records[order]?.events ?? [];
        try {
          await readingEvents.batchCreate(
            manualEvents
              .filter((e: any) => e.event_type !== 'correct')
              .map((e: any) => ({
                reading_record_id: record.id,
                word: e.word,
                timestamp_ms: e.timestamp_ms,
                event_type: e.event_type,
                word_index: e.word_index ?? null,
                source: 'manual' as const,
              }))
          );
        } catch (err) {
          console.error('Failed to sync manual events:', err);
        }

        // Save readingRecordId into session context
        setSession({
          ...session,
          records: {
            ...session.records,
            [order]: {
              ...session.records[order],
              readingRecordId: record.id,
            },
          },
        });

        toast('Reading saved successfully', 'success');
        navigate(`/session/${id}/result/${order}`);
      } catch (err: any) {
        toast(err.message || 'Failed to save', 'error');
        setDoneDisabled(false);
      }
    })();
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

  // Render CSS floating background particles
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

  return (
    <Layout title={`Article ${order} of 3`} backTo={`/session/${id}/ready`}>
      
      {/* Styles injector */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes pop-bounce {
          0% { transform: scale(0.9) translateY(8px); opacity: 0; }
          70% { transform: scale(1.02) translateY(-2px); }
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
        .animate-float-slow { animation: float-slow 4.5s ease-in-out infinite; }
        .animate-pop-bounce { animation: pop-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
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

        .btn-3d {
          transition: all 0.1s ease-in-out;
        }
        .btn-3d:active {
          transform: translateY(2px);
          border-bottom-width: 2px !important;
        }
      `}</style>

      {/* Gamified Themed Outer Container */}
      <div className={`mx-auto max-w-6xl py-4 flex flex-col gap-6 select-none px-4 sm:px-6 transition-all duration-700 rounded-3xl p-6 shadow-2xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden`}>
        
        {/* Floating Particles background */}
        {renderThemeParticles(activeRealm.particleType)}

        {/* Double-Panel Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10">
          
          {/* LEFT SIDE (8 columns): The reading article card and recorder control */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            
            {/* Styled Recording status bar */}
            <div className="flex items-center justify-between rounded-2xl bg-white/95 border border-white/20 px-6 py-4 shadow-md backdrop-blur">
              <div className="flex items-center gap-3">
                <span className={`inline-block h-3.5 w-3.5 rounded-full border border-white/30 ${statusColor}`} />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black font-mono tabular-nums text-slate-800">
                  {formatMs(recorder.elapsedMs)}
                </span>
                <div className="flex gap-2">
                  {recorder.status === 'recording' && (
                    <button
                      onClick={() => { synth.playHover(); recorder.pause(); }}
                      className="btn-3d px-3.5 py-1.5 rounded-xl text-xs font-bold border border-b-4 border-slate-350 bg-slate-100 hover:bg-slate-200 border-b-slate-300 text-slate-700 active:translate-y-[2px]"
                    >
                      Pause ⏸
                    </button>
                  )}
                  {recorder.status === 'paused' && (
                    <button
                      onClick={() => { synth.playSelect(); recorder.resume(); }}
                      className="btn-3d px-3.5 py-1.5 rounded-xl text-xs font-bold border border-b-4 border-emerald-650 bg-emerald-500 hover:bg-emerald-600 border-b-emerald-700 text-white active:translate-y-[2px]"
                    >
                      Resume ▶
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Glassmorphic Beautiful Reading Article card */}
            <div className="rounded-3xl bg-white/95 border border-white/20 p-8 shadow-xl backdrop-blur flex-1 flex flex-col justify-between min-h-[360px]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  READING QUEST
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-3 leading-tight">
                  {article?.title}
                </h2>
                
                {/* Word list clickers */}
                <div className="text-lg md:text-xl font-medium text-slate-750 leading-[2.2] tracking-wide">
                  {article?.content.split(' ').map((word, i) => {
                    const cleanWord = word.replace(/[.,!?"'()]/g, '');
                    const wordEvent = events.find(
                      (e) => e.word_index === i
                    );
                    const isMisread = wordEvent?.event_type === 'misread';
                    const isPauseWord = wordEvent?.event_type === 'pause';

                    return (
                      <span key={i} className="inline-block mr-1 relative">
                        <span
                          onClick={() => toggleWordMark(cleanWord, i, 'misread')}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, wordIndex: i, word: cleanWord });
                          }}
                          className={`cursor-pointer rounded px-1 py-0.5 transition-all duration-120 font-semibold select-none ${
                            isMisread
                              ? 'bg-red-150 text-red-700 line-through decoration-red-400 font-bold border border-red-200 scale-95 shadow-sm'
                              : isPauseWord
                              ? 'bg-amber-100 text-amber-700 font-bold border border-amber-300 shadow-sm'
                              : 'hover:bg-indigo-50 text-slate-800'
                          }`}
                          title="Left-click: toggle misread | Right-click: choose type"
                        >
                          {word}
                        </span>
                        {/* Pause pill after word */}
                        {isPauseWord && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-black text-amber-700 ml-0.5 align-middle leading-none">
                            ⏸
                          </span>
                        )}{' '}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status footer inside article card */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
                <button
                  onClick={markGlobalPause}
                  className="btn-3d px-4 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-b-4 border-amber-250 border-b-amber-400 rounded-xl active:translate-y-[2px]"
                >
                  ⏸ Mark Pause
                </button>
                <div className="flex gap-2 text-xs font-black">
                  <span className="rounded-full bg-red-50 border border-red-100 px-3.5 py-1.5 text-red-600 shadow-sm">
                    🔥 {events.filter((e) => e.event_type === 'misread').length} misread
                  </span>
                  <span className="rounded-full bg-amber-50 border border-amber-100 px-3.5 py-1.5 text-amber-600 shadow-sm">
                    ⚡ {events.filter((e) => e.event_type === 'pause').length} pauses
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT SIDE (4 columns): Companion Mascot cheering column */}
          <div className="col-span-1 lg:col-span-4 flex flex-col justify-between bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-6 text-center shadow-lg relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-15 filter blur-xl bg-white/20 animate-pulse" />

            <div>
              <p className="text-[10px] font-black text-slate-350 uppercase tracking-widest mb-4">🐾 Companion Buddy 🐾</p>
              
              {/* Encouragement dialogue bubble */}
              <div className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-xs md:text-sm text-center leading-relaxed mb-6 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 before:content-[''] before:absolute before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-[9px] before:border-transparent before:border-t-slate-200/90 z-10 animate-pop-bounce">
                {mascotSpeech}
              </div>

              {/* Large responsive Avatar circle */}
              <button 
                onClick={() => synth.playMeow()}
                className="relative w-44 h-44 md:w-52 md:h-52 mx-auto rounded-full bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center animate-float-slow hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="Click me to meow!"
              >
                <div className="absolute inset-4 rounded-full bg-white/5 filter blur(6px)" />
                <CatAvatar 
                  catId={selectedCatId} 
                  expression={recorder.status === 'recording' ? 'happy' : recorder.status === 'paused' ? 'sleepy' : 'neutral'} 
                  activeCostume={activeCostume}
                  className="w-full h-full p-2"
                />
                <span className="absolute bottom-2 right-2 text-xs bg-slate-900/60 text-white font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Meow 🔊
                </span>
              </button>
            </div>

            <div className="mt-8 space-y-4">
              {/* Mic Issue display */}
              {recorder.error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 font-semibold leading-relaxed">
                  ⚠️ Mic issue: {recorder.error}
                </div>
              )}

              {/* Finish Done Reading button */}
              <button
                onClick={handleDone}
                disabled={doneDisabled}
                className="btn-3d w-full flex items-center justify-center p-4 rounded-2xl border-b-5 font-black text-lg bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white border-b-emerald-700 hover:border-b-emerald-800 shadow-lg active:translate-y-[3px] active:border-b-2 disabled:opacity-50 animate-pulse"
              >
                🎉 I'm Done Reading!
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Right-click context menu */}
      {contextMenu && (() => {
        const existingEvent = session.records[order]?.events?.find(
          (e: any) => e.word_index === contextMenu.wordIndex
        );
        const isMarked = !!existingEvent;
        const isMisread = existingEvent?.event_type === 'misread';
        const isPause = existingEvent?.event_type === 'pause';

        return (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            className="fixed z-50 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl py-1.5 min-w-[180px] backdrop-blur-xl overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <p className="px-4 py-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5">
              "{contextMenu.word}"
            </p>
            <button
              onClick={() => { toggleWordMark(contextMenu.word, contextMenu.wordIndex, 'misread'); setContextMenu(null); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors ${
                isMisread ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'text-red-300 hover:bg-red-500/10 hover:text-red-200'
              }`}
            >
              🔥 {isMisread ? '✓ Marked — click to unmark' : 'Mark as Misread'}
            </button>
            <button
              onClick={() => { toggleWordMark(contextMenu.word, contextMenu.wordIndex, 'pause'); setContextMenu(null); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 transition-colors ${
                isPause ? 'bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : 'text-amber-300 hover:bg-amber-500/10 hover:text-amber-200'
              }`}
            >
              ⏸ {isPause ? '✓ Marked — click to unmark' : 'Mark as Pause'}
            </button>
            {isMarked && (
              <button
                onClick={() => { toggleWordMark(contextMenu.word, contextMenu.wordIndex, existingEvent.event_type as 'misread' | 'pause'); setContextMenu(null); }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-500/10 hover:text-slate-300 flex items-center gap-3 transition-colors border-t border-white/5"
              >
                ✕ Remove Mark
              </button>
            )}
          </div>
        </>
        );
      })()}

    </Layout>
  );
}

