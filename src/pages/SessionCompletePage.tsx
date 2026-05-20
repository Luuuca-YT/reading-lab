import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import { useSession } from '../context/SessionContext';
import { CatAvatar, cats } from '../components/CatAvatar';
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

  const selectedCatId = session.selectedCatId || 'leo';
  const selectedThemeId = session.selectedThemeId || 'space';
  const activeCostume = session.activeCostume || null;

  const activeRealm = useMemo(() => {
    return realms.find(r => r.id === selectedThemeId) || realms[0];
  }, [selectedThemeId]);

  const activeCat = useMemo(() => {
    return cats.find(c => c.id === selectedCatId) || cats[0];
  }, [selectedCatId]);

  const celebrationSpeech = useMemo(() => {
    const speeches: Record<string, string> = {
      leo: `OH MY GOSH, ${session.studentName}! Day Completed successfully! 🚀🧑‍🚀 We navigated through all space debris and read like absolute superstars! Leo is so proud of you! Let's blast off! 💥🦁`,
      luna: `Splendidly complete, ${session.studentName}! 👑🎀 A highly elegant and brilliant reading session, darling! You parsed the hardest vocabulary with absolute royal perfection. Sparkling job! 💎👸`,
      milo: `HOORAY! We did it, ${session.studentName}! 🍩😻 We read so many delicious sentences! I think this legendary accomplishment deserves a giant plate of double-fudge chocolate cookies! 🍪🎉🧁`,
      shadow: `Incredible mental power, apprentice ${session.studentName}! 🧙‍♂️🔮 The ancient spell of reading is fully complete. The spirits of the starry libraries are singing our praises! Masterful work! 🌌✨`
    };
    return speeches[activeCat.id] || speeches.leo;
  }, [activeCat.id, session.studentName]);

  const realmBadge = useMemo(() => {
    const badges: Record<string, { title: string; emoji: string; sub: string; border: string; glow: string }> = {
      space: { title: "Cosmic Voyager Badge", emoji: "🛸", sub: "Galactic Navigator", border: "border-indigo-400/40", glow: "shadow-indigo-500/25" },
      jungle: { title: "Jungle Explorer Badge", emoji: "🦁", sub: "Lush Ruins Pathfinder", border: "border-emerald-400/40", glow: "shadow-emerald-500/25" },
      ocean: { title: "Deep Sea Diver Badge", emoji: "🔱", sub: "Coral Reef Legend", border: "border-cyan-400/40", glow: "shadow-cyan-500/25" },
      library: { title: "Archmage Librarian Badge", emoji: "🔮", sub: "Grimoire Cryptographer", border: "border-purple-400/40", glow: "shadow-purple-500/25" }
    };
    return badges[selectedThemeId] || badges.space;
  }, [selectedThemeId]);

  function handleDone() {
    synth.playSuccess();
    resetSession();
    navigate('/');
  }

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

  if (showConfidence && session.sessionId) {
    return (
      <Layout title={`Day ${session.dayNumber} · After reading`}>
        {styles}
        <div className={`mx-auto max-w-4xl p-6 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden shadow-2xl`}>
          {renderThemeParticles(activeRealm.particleType)}
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block rounded-full bg-white/10 px-5 py-2 text-sm font-black text-white backdrop-blur border border-white/10 tracking-wider">
              🏆 {session.studentName} · Day {session.dayNumber} Complete
            </div>
          </div>
          
          <div className="relative z-10 bg-white/95 rounded-2xl p-6 shadow-xl text-slate-800">
            <ConfidenceCheck
              sessionId={session.sessionId}
              phase="after"
              onSubmit={() => {
                synth.playSuccess();
                setShowConfidence(false);
              }}
              buttonLabel="See Graduation Summary →"
              selectedCatId={selectedCatId}
              activeCostume={activeCostume}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Session Complete">
      {styles}
      
      {/* Dynamic Realm Graduation Screen */}
      <div className={`mx-auto max-w-4xl p-6 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden shadow-2xl flex flex-col items-center gap-8 text-center select-none`}>
        {renderThemeParticles(activeRealm.particleType)}

        {/* 1. Header & Graduation Announcement */}
        <div className="space-y-3 z-10">
          <div className="inline-block rounded-full bg-white/15 px-5 py-2 text-xs font-black text-white shadow-sm border border-white/15 uppercase tracking-widest animate-bounce">
            🌟 Daily Graduation Success 🌟
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight">
            Day {session.dayNumber} Completed!
          </h1>
          <p className="text-sm text-white/70 max-w-md mx-auto">
            Sensational effort today! You crushed your reading assignment and unlocked amazing achievements!
          </p>
        </div>

        {/* 2. Celebration Mascot Column */}
        <div className="flex flex-col md:flex-row items-center gap-6 max-w-2xl w-full bg-slate-900/60 border border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-xl z-10">
          
          {/* Celebrating Companion */}
          <div className="relative w-36 h-36 rounded-full bg-white/15 border-4 border-white/20 shadow-2xl flex items-center justify-center animate-float-slow cursor-pointer shrink-0" onClick={() => synth.playMeow()}>
            <div className="absolute inset-3 rounded-full bg-white/5 filter blur(4px)" />
            <CatAvatar 
              catId={activeCat.id} 
              expression="excited"
              activeCostume={activeCostume}
              className="w-full h-full p-1.5"
            />
          </div>

          {/* Grand Speech Bubble */}
          <div className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-sm md:text-base text-left leading-relaxed animate-pop-bounce flex-1 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 md:after:bottom-auto md:after:left-[-16px] md:after:top-1/2 md:after:-translate-y-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 md:after:border-r-white/95 md:after:border-t-transparent">
            {celebrationSpeech}
          </div>
        </div>

        {/* 3. Double Feature: Reward Realm Badge & Graduation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full z-10">
          
          {/* LEFT: Game Badge Emblem Card */}
          <div className={`col-span-1 md:col-span-5 border bg-slate-950/60 backdrop-blur rounded-2xl p-5 flex flex-col items-center justify-center shadow-2xl relative ${realmBadge.border} ${realmBadge.glow}`}>
            <span className="text-7xl animate-pulse mb-3 filter drop-shadow-md select-none">{realmBadge.emoji}</span>
            <h3 className="text-lg font-black text-white tracking-wide">{realmBadge.title}</h3>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">{realmBadge.sub}</p>
          </div>

          {/* RIGHT: Metric Cards Grid */}
          <div className="col-span-1 md:col-span-7 grid grid-cols-3 gap-4">
            
            {/* Articles Read */}
            <div className="rounded-xl border border-white/10 bg-white/10 backdrop-blur p-4 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
              <span className="text-3xl font-black text-white">3</span>
              <span className="mt-1 text-[9px] font-black text-white/60 uppercase tracking-wider text-center">
                Articles Read
              </span>
            </div>

            {/* Misread words */}
            <div className="rounded-xl border border-red-500/20 bg-red-950/30 backdrop-blur p-4 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
              <span className="text-3xl font-black text-red-400">{totalMisread}</span>
              <span className="mt-1 text-[9px] font-black text-red-300/80 uppercase tracking-wider text-center">
                Misread Words
              </span>
            </div>

            {/* Pauses count */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 backdrop-blur p-4 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
              <span className="text-3xl font-black text-amber-400">{totalPauses}</span>
              <span className="mt-1 text-[9px] font-black text-amber-300/80 uppercase tracking-wider text-center">
                Pauses
              </span>
            </div>

          </div>

        </div>

        {/* 4. Per-article individual summaries */}
        <div className="w-full space-y-3 z-10">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest text-left pl-1">
            🗺️ Chapter Summaries
          </h3>
          {[1, 2, 3].map((i) => {
            const rec = session.records[i];
            const misreadCount = rec?.events?.filter((e) => e.event_type === 'misread').length ?? 0;
            const pauseCount = rec?.events?.filter((e) => e.event_type === 'pause').length ?? 0;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/95 text-slate-800 px-5 py-4 shadow-md transition-all hover:bg-white"
              >
                <div className="text-left">
                  <div className="font-extrabold text-slate-900 text-sm md:text-base">Article {i}</div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    Self Assessment: {rec?.studentFeedback?.[1] ?? '—'} · Tutor Notes: {rec?.tutorFeedback?.[1] ?? '—'}
                  </div>
                </div>
                <div className="flex gap-4 text-xs font-bold shrink-0">
                  <span className="text-red-600 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full">{misreadCount} misread</span>
                  <span className="text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">{pauseCount} pauses</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 z-10 w-full justify-center">
          <Button variant="secondary" size="lg" onClick={() => navigate(`/students/${session.studentId}`)} className="bg-white/10 hover:bg-white/20 text-white border-white/10 font-bold px-8">
            📂 View Student Profile
          </Button>
          <Button size="lg" onClick={handleDone} className="bg-amber-500 hover:bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-500/25 font-black px-10">
            Back to Home 🏠
          </Button>
        </div>
      </div>
    </Layout>
  );
}
