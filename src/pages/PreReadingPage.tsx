import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import { useSession } from '../context/SessionContext';
import { articles } from '../db';
import type { Article } from '../db';
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
  desc: string;
}

const realms: RealmConfig[] = [
  {
    id: 'space',
    name: 'Cosmic Nebula',
    emoji: '🚀',
    bgGrad: 'from-indigo-950 via-slate-900 to-indigo-900 text-slate-100',
    glowColor: 'bg-indigo-500',
    particleType: 'space',
    textColor: 'text-indigo-400',
    desc: 'Explore the solar system amongst glowing stars and floating comets.'
  },
  {
    id: 'jungle',
    name: 'Emerald Jungle',
    emoji: '🌴',
    bgGrad: 'from-emerald-950 via-teal-950 to-stone-900 text-stone-100',
    glowColor: 'bg-emerald-500',
    particleType: 'jungle',
    textColor: 'text-emerald-400',
    desc: 'Adventure through the lush vines, hidden ancient temples, and rustling leaves.'
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    bgGrad: 'from-cyan-950 via-blue-950 to-sky-900 text-sky-100',
    glowColor: 'bg-cyan-500',
    particleType: 'ocean',
    textColor: 'text-cyan-400',
    desc: 'Dive deep into crystal clear waters with playful fish and bubbly coral reefs.'
  },
  {
    id: 'library',
    name: 'Starry Library',
    emoji: '🏰',
    bgGrad: 'from-purple-950 via-violet-900 to-amber-950 text-amber-100',
    glowColor: 'bg-amber-500',
    particleType: 'library',
    textColor: 'text-amber-400',
    desc: 'Study wizard spells, dusty scrolls, and ancient lore in a magical tower.'
  }
];

export function PreReadingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [article, setArticle] = useState<Article | null>(null);

  // Picker onboarding stages: 'cat' | 'realm' | 'ready'
  const [stage, setStage] = useState<'cat' | 'realm' | 'ready'>(() => {
    if (!session.selectedCatId || !session.selectedThemeId) {
      return 'cat';
    }
    return 'ready';
  });

  const [tempCatId, setTempCatId] = useState<string | null>(null);
  const [hoveredCatIdx, setHoveredCatIdx] = useState<number | null>(null);
  const [hoveredRealmIdx, setHoveredRealmIdx] = useState<number | null>(null);

  // Show confidence check only before article 1 (start of the day)
  const [showConfidence, setShowConfidence] = useState(session.currentArticle === 1);

  useEffect(() => {
    const articleId = session.articleIds[session.currentArticle - 1];
    if (articleId) {
      articles.getById(articleId).then((a) => setArticle(a ?? null));
    }
  }, [session.currentArticle, session.articleIds]);

  function handleCatSelect(catId: string) {
    synth.playSelect();
    synth.playMeow();
    setTempCatId(catId);
    setStage('realm');
  }

  function handleRealmSelect(realmId: string) {
    synth.playSelect();
    setSession({
      ...session,
      selectedCatId: tempCatId || 'leo',
      selectedThemeId: realmId,
    });
    setStage('ready');
  }

  function handleStart() {
    synth.playSuccess();
    navigate(`/session/${id}/read/${session.currentArticle}`);
  }

  function equipCostume(costumeId: 'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null) {
    synth.playCostume();
    setSession({
      ...session,
      activeCostume: costumeId,
    });
  }

  const activeRealm = useMemo(() => {
    const realmId = session.selectedThemeId || 'space';
    return realms.find(r => r.id === realmId) || realms[0];
  }, [session.selectedThemeId]);

  const activeCat = useMemo(() => {
    const catId = session.selectedCatId || 'leo';
    return cats.find(c => c.id === catId) || cats[0];
  }, [session.selectedCatId]);

  const encouragements = {
    leo: "Spacesuit locked! Leo the astro-lion is ready to blast past this reading quest! Let's do it! 🚀🧑‍🚀",
    luna: "Remember, keep your posture elegant and your reading flawless, darling! You are ready. 🎀👑",
    milo: "Ooh, this page looks super delicious! Can't wait to read with you! Yum yum! 🍩😻",
    shadow: "The stellar alignment is perfect. Let our magical voice fill the air, apprentice! 🧙‍♂️✨"
  };

  const currentEncouragement = encouragements[activeCat.id as 'leo' | 'luna' | 'milo' | 'shadow'] || encouragements.leo;

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

  // Animation Styles Injection
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

      .card-3d {
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .card-3d:hover {
        transform: translateY(-6px);
      }
      .card-3d:active {
        transform: translateY(2px);
      }
    `}</style>
  );

  // -------------------------------------------------------------
  // STAGE 1: CHOOSE COMPANION CAT
  // -------------------------------------------------------------
  if (stage === 'cat') {
    return (
      <Layout title="Meet Your Companion" backTo="/session/setup">
        {styles}
        <div className="mx-auto max-w-5xl py-8 px-4 text-center space-y-10">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-bluebook-100 px-5 py-2 text-xs font-black text-bluebook-700 uppercase tracking-widest animate-bounce">
              Stage 1 of 2
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-bluebook-900 leading-tight">
              Choose Your Companion! 🐾
            </h1>
            <p className="text-base text-bluebook-500 max-w-xl mx-auto">
              Pick your cute cat buddy to join you on today's reading adventure!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {cats.map((c, idx) => {
              const isHovered = hoveredCatIdx === idx;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCatSelect(c.id)}
                  onMouseEnter={() => {
                    synth.playHover();
                    setHoveredCatIdx(idx);
                  }}
                  onMouseLeave={() => setHoveredCatIdx(null)}
                  className={`card-3d text-left flex flex-col items-center p-6 rounded-3xl border-2 border-b-8 bg-white transition-all select-none cursor-pointer ${
                    isHovered
                      ? 'border-bluebook-500 border-b-bluebook-600 shadow-xl scale-102 ring-4 ring-bluebook-100'
                      : 'border-bluebook-100 border-b-bluebook-200 shadow-sm'
                  }`}
                >
                  <div className="relative w-40 h-40 rounded-full bg-bluebook-50/50 p-3 mb-4 group-hover:scale-105 transition-all">
                    <CatAvatar
                      catId={c.id}
                      expression={isHovered ? 'excited' : 'neutral'}
                      className="w-full h-full"
                    />
                  </div>
                  <h3 className="text-xl font-extrabold text-bluebook-900 mb-1 flex items-center gap-1.5">
                    <span>{c.name}</span>
                    <span className="text-lg leading-none">{c.emoji}</span>
                  </h3>
                  <p className="text-[10px] font-black text-bluebook-400 uppercase tracking-wider mb-2">
                    {c.breed}
                  </p>
                  <p className="text-xs text-bluebook-650 text-center leading-relaxed font-medium">
                    {c.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  // -------------------------------------------------------------
  // STAGE 2: CHOOSE READING REALM (THEME)
  // -------------------------------------------------------------
  if (stage === 'realm') {
    return (
      <Layout title="Pick Your Realm" backTo="/session/setup">
        {styles}
        <div className="mx-auto max-w-5xl py-8 px-4 text-center space-y-10">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-bluebook-100 px-5 py-2 text-xs font-black text-bluebook-700 uppercase tracking-widest">
              Stage 2 of 2
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-bluebook-900 leading-tight">
              Choose Your Realm! 🌌
            </h1>
            <p className="text-base text-bluebook-500 max-w-xl mx-auto">
              Where would you like to travel? Your realm shape-shifts the entire visual experience!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {realms.map((r, idx) => {
              const isHovered = hoveredRealmIdx === idx;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRealmSelect(r.id)}
                  onMouseEnter={() => {
                    synth.playHover();
                    setHoveredRealmIdx(idx);
                  }}
                  onMouseLeave={() => setHoveredRealmIdx(null)}
                  className={`card-3d text-left flex flex-col p-6 rounded-3xl border-2 border-b-8 transition-all select-none cursor-pointer bg-gradient-to-br ${r.bgGrad} relative overflow-hidden ${
                    isHovered
                      ? 'border-white border-b-white/80 shadow-2xl scale-[1.01] ring-4 ring-white/10'
                      : 'border-white/10 border-b-white/20 shadow-md'
                  }`}
                >
                  {/* Absolute subtle glowing sphere */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 filter blur-xl ${r.glowColor}`} />
                  
                  {/* Small ambient particle triggers in cards */}
                  {isHovered && renderThemeParticles(r.particleType)}

                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <span className="text-4xl filter drop-shadow-md leading-none">{r.emoji}</span>
                    <div>
                      <h3 className="text-2xl font-black text-white">{r.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                        {r.id.toUpperCase()} REALM
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm font-semibold text-white/80 leading-relaxed max-w-md relative z-10">
                    {r.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-6">
            <Button variant="ghost" onClick={() => setStage('cat')}>
              ← Back to Companions
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // -------------------------------------------------------------
  // STAGE 3: PRE-READING DASHBOARD (Encouragement, Confidence, Wardrobe)
  // -------------------------------------------------------------
  if (showConfidence) {
    return (
      <Layout title={`Day ${session.dayNumber} · Before reading`} backTo={`/session/setup`}>
        {styles}
        <div className={`mx-auto max-w-5xl py-8 px-4 flex flex-col gap-6 rounded-3xl p-6 shadow-2xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden`}>
          {renderThemeParticles(activeRealm.particleType)}

          <div className="flex justify-between items-center z-10 px-2">
            <div className="inline-block rounded-full bg-white/10 px-5 py-2 text-xs font-black text-white shadow-sm backdrop-blur border border-white/10 uppercase tracking-widest">
              {session.studentName} · Day {session.dayNumber}
            </div>
            
            <button 
              onClick={() => setStage('cat')}
              className="text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 backdrop-blur"
            >
              🔄 Change Cat/Theme
            </button>
          </div>

          <div className="mx-auto max-w-4xl py-6 w-full z-10">
            <ConfidenceCheck
              sessionId={Number(id)}
              phase="before"
              onSubmit={() => setShowConfidence(false)}
              buttonLabel="Proceed to Reading"
              selectedCatId={session.selectedCatId || 'leo'}
              activeCostume={session.activeCostume}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Day ${session.dayNumber} · Article ${session.currentArticle} of 3`} backTo={`/session/setup`}>
      {styles}
      
      {/* Gamified prep dashboard using selected Cat and Realm Theme */}
      <div className={`mx-auto max-w-6xl py-4 flex flex-col gap-6 select-none px-4 sm:px-6 transition-all duration-700 rounded-3xl p-6 shadow-2xl border border-white/10 bg-gradient-to-br ${activeRealm.bgGrad} relative overflow-hidden`}>
        
        {/* Floating Particles */}
        {renderThemeParticles(activeRealm.particleType)}

        {/* Header Metadata */}
        <div className="flex justify-between items-center z-10 px-1">
          <div className="inline-block rounded-full bg-white/10 px-5 py-2 text-xs font-black text-white shadow-sm backdrop-blur border border-white/10 uppercase tracking-widest">
            {session.studentName} · {session.tutorName}
          </div>
          
          <button 
            onClick={() => setStage('cat')}
            className="text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 backdrop-blur"
          >
            🔄 Switch Cat/Theme
          </button>
        </div>

        {/* Double Column Dashboard Design */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center min-h-[400px] z-10">
          
          {/* LEFT COLUMN: Animated Mascot Cat & Wardrobe dressing shelf */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center bg-black/15 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-6 text-center min-h-[380px] shadow-lg relative overflow-hidden group">
            
            {/* Absolute ambient light sphere */}
            <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 filter blur-2xl animate-glow bg-white/20`} />

            {/* encouraging Speech Bubble */}
            <div className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-sm md:text-base text-center max-w-sm w-full leading-relaxed animate-pop-bounce mb-6 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 before:content-[''] before:absolute before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-[9px] before:border-transparent before:border-t-slate-200/90 z-10">
              {currentEncouragement}
            </div>

            {/* Floating Mascot Avatar */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center animate-float-slow z-10">
              <div className="absolute inset-4 rounded-full bg-white/5 filter blur(6px)" />
              <CatAvatar 
                catId={activeCat.id} 
                expression="happy"
                activeCostume={session.activeCostume}
                className="w-full h-full p-2.5"
              />
            </div>

            {/* Outfit Wardrobe closet drawer */}
            <div className="mt-6 w-full max-w-xs bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-2 shadow-md z-10">
              <p className="text-[9px] font-black text-slate-350 uppercase tracking-widest mb-1.5 text-center">🐾 Outfit Wardrobe 🐾</p>
              <div className="flex justify-around items-center gap-1">
                {[
                  { id: 'none', label: 'Base', emoji: '🐱' },
                  { id: 'astronaut', label: 'Space', emoji: '🧑‍🚀' },
                  { id: 'pirate', label: 'Pirate', emoji: '🏴‍☠️' },
                  { id: 'sunglasses', label: 'Cool', emoji: '😎' },
                  { id: 'wizard', label: 'Wizard', emoji: '🧙‍♂️' },
                  { id: 'crown', label: 'Royal', emoji: '👑' }
                ].map((closetItem) => {
                  const isEquipped = session.activeCostume === closetItem.id || (closetItem.id === 'none' && !session.activeCostume);
                  return (
                    <button
                      key={closetItem.id}
                      onClick={() => equipCostume(closetItem.id === 'none' ? null : closetItem.id as any)}
                      className={`h-11 w-11 flex flex-col items-center justify-center rounded-xl border border-b-4 transition-all ${
                        isEquipped
                          ? 'bg-amber-500/30 border-amber-400 border-b-amber-500 text-white scale-105 shadow-md shadow-amber-500/10'
                          : 'bg-white/5 border-white/10 border-b-white/20 hover:bg-white/10 text-slate-300 hover:translate-y-[-1px]'
                      }`}
                      title={`Equip ${closetItem.label}`}
                    >
                      <span className="text-lg leading-none">{closetItem.emoji}</span>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">{closetItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Instructions and Prep dashboard details */}
          <div className="col-span-1 md:col-span-7 flex flex-col gap-6">
            
            <div className="bg-black/20 rounded-3xl border border-white/5 p-6 md:p-8 shadow-md flex flex-col gap-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                ACTIVE PASSAGE
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {article?.title ?? 'Loading title...'}
              </h2>
              <div className="h-0.75 w-16 bg-white/25 rounded-full my-1" />
              <p className="text-slate-300 text-sm md:text-base font-semibold leading-relaxed">
                Please read this story aloud. Don't worry if you make mistakes or pause — just keep going. Your companion cat {activeCat.name} will be right beside you tracking your stars!
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <button
                onClick={() => navigate(`/session/setup`)}
                className="btn-3d w-1/3 flex items-center justify-center p-3 rounded-2xl border-2 border-b-5 border-white/10 bg-white/5 text-slate-200 border-b-white/20 font-bold hover:bg-white/10 active:translate-y-[3px] active:border-b-2"
              >
                Go Back
              </button>
              
              <button
                onClick={handleStart}
                className="btn-3d flex-1 flex items-center justify-center p-4 rounded-2xl border-b-5 font-black text-lg bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white border-b-emerald-700 hover:border-b-emerald-800 shadow-lg active:translate-y-[3px] active:border-b-2 animate-pulse"
              >
                🚀 Start Reading!
              </button>
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}

