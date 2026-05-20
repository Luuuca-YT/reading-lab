import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';
import { CatAvatar, cats, getDialogue } from '../components/CatAvatar';
import { synth } from '../utils/audio';

// ==========================================
// DATA STRUCTURES
// ==========================================
interface Option {
  emoji: string;
  label: string;
  expression: 'neutral' | 'happy' | 'excited' | 'smug' | 'shocked' | 'sad' | 'angry' | 'sleepy';
}

interface Question {
  key: string;
  label: string;
  highlight: string;
  description: string;
  themeColor: 'emerald' | 'purple' | 'amber' | 'blue';
  baseExpression: 'neutral' | 'happy' | 'excited' | 'smug' | 'shocked' | 'sad' | 'angry' | 'sleepy';
  options: Option[];
}

const questions: Question[] = [
  {
    key: 'q1_understand',
    label: 'How much {h} did you put in while reading this passage?',
    highlight: 'effort',
    description: 'Did you concentrate and try your best to read clearly?',
    themeColor: 'emerald',
    baseExpression: 'neutral',
    options: [
      { emoji: '💤', label: 'Almost none', expression: 'sleepy' },
      { emoji: '🐌', label: 'A little', expression: 'sad' },
      { emoji: '🚶', label: 'Some', expression: 'neutral' },
      { emoji: '🏃', label: 'A lot', expression: 'happy' },
      { emoji: '🚀', label: 'A whole lot', expression: 'excited' },
    ],
  },
  {
    key: 'q2_difficulty',
    label: 'How {h} was it for you to read this passage?',
    highlight: 'hard',
    description: 'Were the words and sentences easy or tough for you?',
    themeColor: 'purple',
    baseExpression: 'neutral',
    options: [
      { emoji: '🎈', label: 'Very easy', expression: 'excited' },
      { emoji: '🌱', label: 'Easy', expression: 'happy' },
      { emoji: '🚲', label: 'Medium', expression: 'smug' },
      { emoji: '🧗', label: 'Hard', expression: 'shocked' },
      { emoji: '⛰️', label: 'Very Hard', expression: 'sad' },
    ],
  },
  {
    key: 'q3_interest',
    label: 'How much did you {h} reading this passage?',
    highlight: 'enjoy',
    description: 'Did you find the content fun and interesting to read?',
    themeColor: 'amber',
    baseExpression: 'neutral',
    options: [
      { emoji: '💔', label: 'Did not want to finish it', expression: 'angry' },
      { emoji: '🥱', label: 'Not very fun', expression: 'sad' },
      { emoji: '🍿', label: 'It was okay', expression: 'neutral' },
      { emoji: '⭐', label: 'I enjoyed it', expression: 'happy' },
      { emoji: '🎉', label: 'Great! I want to read more!', expression: 'excited' },
    ],
  },
  {
    key: 'q4_effort',
    label: 'How much did you {h} about this topic before reading this passage?',
    highlight: 'already know',
    description: 'Was this topic brand new, or did you know a lot about it?',
    themeColor: 'blue',
    baseExpression: 'neutral',
    options: [
      { emoji: '❓', label: 'I knew nothing about it', expression: 'shocked' },
      { emoji: '🔍', label: 'I knew a little', expression: 'sleepy' },
      { emoji: '📚', label: 'I knew some things', expression: 'happy' },
      { emoji: '🌍', label: 'I knew a lot', expression: 'smug' },
      { emoji: '👑', label: 'I already knew everything about it', expression: 'excited' },
    ],
  },
];

interface ThemeConfig {
  key: string;
  bgGrad: string;
  cardBg: string;
  glowColor: string;
  particleType: 'space' | 'jungle' | 'ocean' | 'library';
  textColor: string;
}

const slideThemes: ThemeConfig[] = [
  {
    key: 'q1_understand',
    bgGrad: 'from-indigo-950 via-slate-900 to-indigo-900 text-slate-100',
    cardBg: 'bg-slate-900/75 border-indigo-500/25 text-slate-100 shadow-indigo-500/10',
    glowColor: 'bg-indigo-500',
    particleType: 'space',
    textColor: 'text-indigo-400'
  },
  {
    key: 'q2_difficulty',
    bgGrad: 'from-emerald-950 via-teal-950 to-stone-900 text-stone-100',
    cardBg: 'bg-emerald-950/75 border-emerald-500/25 text-stone-100 shadow-emerald-500/10',
    glowColor: 'bg-emerald-500',
    particleType: 'jungle',
    textColor: 'text-emerald-400'
  },
  {
    key: 'q3_interest',
    bgGrad: 'from-cyan-950 via-blue-950 to-sky-900 text-sky-100',
    cardBg: 'bg-cyan-950/75 border-cyan-500/25 text-sky-100 shadow-cyan-500/10',
    glowColor: 'bg-cyan-500',
    particleType: 'ocean',
    textColor: 'text-cyan-400'
  },
  {
    key: 'q4_effort',
    bgGrad: 'from-purple-950 via-violet-900 to-amber-950 text-amber-100',
    cardBg: 'bg-purple-950/75 border-amber-500/25 text-amber-100 shadow-amber-500/10',
    glowColor: 'bg-amber-500',
    particleType: 'library',
    textColor: 'text-amber-400'
  }
];

export function StudentFeedbackPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const order = Number(articleOrder);

  // Read globally selected cat ID and active costume (or fallbacks)
  const selectedCatId = session.selectedCatId || 'leo';
  const activeCostume = session.activeCostume || null;

  // Active state handlers
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Transition directions
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentIdx];
  const selectedAnswer = answers[currentQuestion.key] ?? '';
  const isCurrentAnswered = !!selectedAnswer;

  const answeredCount = useMemo(() => {
    return questions.filter((q) => answers[q.key]).length;
  }, [answers]);

  const allAnswered = answeredCount === questions.length;

  const currentTheme = slideThemes[currentIdx];

  const activeCat = useMemo(() => {
    return cats.find(c => c.id === selectedCatId) || cats[0];
  }, [selectedCatId]);

  // Determine active mascot emoji and dialogue
  const activeMascot = useMemo(() => {
    const isHovered = hoveredIdx !== null;
    let expression: 'neutral' | 'happy' | 'excited' | 'smug' | 'shocked' | 'sad' | 'angry' | 'sleepy' = currentQuestion.baseExpression;
    let labelText: string | null = null;

    if (isHovered) {
      const opt = currentQuestion.options[hoveredIdx!];
      expression = opt.expression;
      labelText = opt.label;
    } else if (selectedAnswer) {
      const selectedIdx = currentQuestion.options.findIndex((opt) => opt.label === selectedAnswer);
      if (selectedIdx !== -1) {
        const opt = currentQuestion.options[selectedIdx];
        expression = opt.expression;
        labelText = opt.label;
      }
    }

    return {
      expression,
      dialogue: getDialogue(selectedCatId, activeCostume, currentQuestion.key, labelText),
      isHovered,
    };
  }, [hoveredIdx, selectedAnswer, currentQuestion, selectedCatId, activeCostume]);

  function selectOption(optionLabel: string) {
    synth.playSelect();
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: optionLabel }));
    
    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 550);
    }
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setSlideDirection('next');
      setIsTransitioning(true);
      setHoveredIdx(null);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 350);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setSlideDirection('prev');
      setIsTransitioning(true);
      setHoveredIdx(null);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setIsTransitioning(false);
      }, 350);
    }
  }

  function handleSubmit() {
    if (!allAnswered) return;

    setSession({
      ...session,
      records: {
        ...session.records,
        [order]: {
          ...session.records[order],
          studentFeedback: questions.map((q) => answers[q.key] ?? ''),
        },
      },
    });
    synth.playSuccess();
    navigate(`/session/${id}/tutor-feedback/${order}`);
  }

  // Outfit changer updates the global session state
  function equipCostume(costumeId: 'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null) {
    synth.playCostume();
    setSession({
      ...session,
      activeCostume: costumeId,
    });
  }

  // Parse label to highlight keyword with dynamic theme tags
  const parsedLabel = useMemo(() => {
    const raw = currentQuestion.label;
    const parts = raw.split('{h}');
    if (parts.length < 2) return <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{raw}</h2>;
    const [before, after] = parts;
    return (
      <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
        {before}
        <span className={`inline-block px-3 py-1 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl shadow-md border border-white/10 ${
          currentQuestion.themeColor === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white' :
          currentQuestion.themeColor === 'purple' ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white' :
          currentQuestion.themeColor === 'amber' ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white' :
          'bg-gradient-to-r from-blue-400 to-sky-500 text-white'
        }`}>
          {currentQuestion.highlight}
        </span>
        {after}
      </h2>
    );
  }, [currentQuestion]);

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
    <Layout title={`Student Feedback · Article ${order}`} backTo={`/session/${id}/read/${order}`}>
      {/* Dynamic Keyframes CSS Injector */}
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
        @keyframes slide-in-next {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-prev {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.08); }
        }

        /* Ambient floating keyframes */
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
        .animate-glow { animation: glow-pulse 4s ease-in-out infinite; }
        
        .slide-enter-next { animation: slide-in-next 0.32s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .slide-enter-prev { animation: slide-in-prev 0.32s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

        /* Assigning particle animations */
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
          transition: all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        .btn-3d:active {
          transform: translateY(3px);
          border-bottom-width: 2px !important;
        }
      `}</style>

      {/* Main morphing container */}
      <div className={`mx-auto max-w-6xl py-4 flex flex-col gap-6 select-none px-4 sm:px-6 transition-all duration-700 rounded-3xl p-6 shadow-2xl border border-white/10 bg-gradient-to-br ${currentTheme.bgGrad}`}>
        
        {/* Progress Header */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-xs font-black text-slate-400 px-1 tracking-wider">
            <span className="opacity-80">COMPANION: {activeCat.name.toUpperCase()} ({activeCat.breed.toUpperCase()})</span>
            <span className="bg-white/10 text-slate-200 px-3 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
          </div>

          {/* Gamified Duolingo-style Progress Bar */}
          <div className="h-4.5 w-full bg-black/20 rounded-full overflow-hidden p-0.5 relative border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500 ease-out shadow-md relative"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-1/3 skew-x-12 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Core Double-Panel Content Layout */}
        <div 
          className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-start min-h-[480px] transition-all duration-320 ${
            isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
          } ${
            slideDirection === 'next' ? 'slide-enter-next' : 'slide-enter-prev'
          }`}
        >
          
          {/* LEFT PANEL: Interactive Mascot Playground */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center bg-black/15 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-6 text-center min-h-[380px] md:min-h-[440px] shadow-lg relative overflow-hidden group">
            
            {/* Ambient colorful background glow matching the question theme */}
            <div className={`absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 filter blur-2xl transition-all duration-700 animate-glow ${currentTheme.glowColor}`} />

            {/* Floating Reactive Particle System Background Container */}
            {renderThemeParticles(currentTheme.particleType)}

            {/* Elastic Speech Bubble */}
            <div 
              key={activeMascot.dialogue}
              className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-sm md:text-base text-center max-w-sm w-full leading-relaxed animate-pop-bounce mb-6 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 before:content-[''] before:absolute before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-[9px] before:border-transparent before:border-t-slate-200/90 z-10"
            >
              {activeMascot.dialogue}
            </div>

            {/* Breathing Mascot Circle Container */}
            <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-full bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center transition-all duration-300 animate-float-slow z-10">
              
              <div className="absolute inset-4 rounded-full bg-white/5 filter blur(6px)" />

              {/* Vector High-Definition Dynamic Cat Face Avatar! */}
              <CatAvatar 
                catId={selectedCatId} 
                expression={activeMascot.expression} 
                activeCostume={activeCostume}
                className="w-full h-full p-2.5"
              />

            </div>

            {/* Interactive Dressing Closet Shelf */}
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
                  const isEquipped = activeCostume === closetItem.id || (closetItem.id === 'none' && !activeCostume);
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

          {/* RIGHT PANEL: Question presentation & Tactile 3D Option Grid */}
          <div className="col-span-1 md:col-span-7 flex flex-col gap-5">
            
            {/* Header Presentation Block */}
            <div className="bg-black/20 rounded-3xl border border-white/5 p-5 md:p-6 shadow-md flex flex-col gap-2 relative overflow-hidden">
              {parsedLabel}
              <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
                {currentQuestion.description}
              </p>
            </div>

            {/* Tactile 3D Option Cards Vertical Stack */}
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt.label;
                const isHovered = hoveredIdx === idx;
                
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectOption(opt.label)}
                    onMouseEnter={() => {
                      synth.playHover();
                      setHoveredIdx(idx);
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`btn-3d group relative flex items-center gap-4 p-3.5 md:p-4 rounded-2xl border-2 border-b-[5px] transition-all cursor-pointer text-left w-full select-none ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-white border-b-emerald-600 shadow-md ring-4 ring-emerald-500/15 scale-[1.01] z-10 translate-y-[-1px]'
                        : isHovered
                        ? 'border-white/30 bg-white/10 text-white border-b-white/40 translate-y-[-2px] shadow-sm'
                        : 'border-white/10 bg-white/5 text-slate-200 border-b-white/20'
                    }`}
                  >
                    
                    {/* Unique Hotkey index badge */}
                    <span className={`h-6 w-6 flex items-center justify-center rounded-lg border text-[10px] font-black select-none ${
                      isSelected 
                        ? 'border-emerald-300 bg-emerald-500/30 text-emerald-200' 
                        : 'border-white/10 bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:border-white/20'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Option Icon: Dynamic customized cat head avatar */}
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 border-white/20 p-1.5 shadow-inner group-hover:scale-110 transition-all duration-250 ${
                      isSelected ? 'bg-white/20 scale-105 border-white/40' : 'bg-white/10'
                    }`}>
                      <CatAvatar 
                        catId={selectedCatId} 
                        expression={opt.expression} 
                        className="w-full h-full" 
                      />
                    </div>

                    {/* Choice Text Label */}
                    <div className="flex flex-col flex-1 gap-0.5">
                      <span className={`font-extrabold text-sm md:text-base pr-4 leading-tight transition-colors ${
                        isSelected ? 'text-white font-black' : 'text-slate-200 group-hover:text-white'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300/95 group-hover:text-white transition-colors flex items-center gap-1">
                        <span>{opt.emoji}</span>
                        <span>{
                          opt.label === 'Almost none' ? 'Felt super tired...' :
                          opt.label === 'A little' ? 'Tried a tiny bit' :
                          opt.label === 'Some' ? 'Focused standard' :
                          opt.label === 'A lot' ? 'Very focused!' :
                          opt.label === 'A whole lot' ? 'Absolute master effort! 🚀' :
                          
                          opt.label === 'Very easy' ? 'Like a walk in the park! 🎈' :
                          opt.label === 'Easy' ? 'Quite smooth 🌱' :
                          opt.label === 'Medium' ? 'A solid challenge 🚲' :
                          opt.label === 'Hard' ? 'Quite tough! 🧗' :
                          opt.label === 'Very Hard' ? 'Extremely difficult! ⛰️' :
                          
                          opt.label === 'Did not want to finish it' ? 'No fun at all 💔' :
                          opt.label === 'Not very fun' ? 'A bit boring... 🥱' :
                          opt.label === 'It was okay' ? 'Decent 🍿' :
                          opt.label === 'I enjoyed it' ? 'Pretty fun! ⭐' :
                          opt.label === 'Great! I want to read more!' ? 'LOVED IT! 🎉' :
                          
                          opt.label === 'I knew nothing about it' ? 'Brand new topic! ❓' :
                          opt.label === 'I knew a little' ? 'Heard of it before 🔍' :
                          opt.label === 'I knew some things' ? 'Decent background 📚' :
                          opt.label === 'I knew a lot' ? 'Quite familiar 🌍' :
                          opt.label === 'I already knew everything about it' ? 'Expert topic! 👑' : ''
                        }</span>
                      </span>
                    </div>

                    {/* Interactive Selection Checkmark Marker */}
                    {isSelected && (
                      <span className="h-5.5 w-5.5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow animate-bounce">
                        ✓
                      </span>
                    )}

                  </button>
                );
              })}
            </div>
            
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex justify-between items-center border-t border-white/10 pt-5 mt-2">
          
          {/* Previous Slide Button */}
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-5 font-bold shadow-sm border border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            ← Previous
          </Button>

          {/* Indicator slider dots */}
          <div className="hidden sm:flex gap-2.5">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIdx
                    ? 'w-6 bg-white shadow'
                    : answers[questions[idx].key]
                    ? 'w-2 bg-emerald-400 shadow-sm'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Next / Submit Button */}
          {currentIdx === questions.length - 1 ? (
            <Button
              size="lg"
              variant="primary"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-8 flex items-center gap-2 font-extrabold transition-all duration-150 shadow border-b-[5px] border-emerald-700 active:border-b-0 active:translate-y-[4px] active:scale-95 ${
                allAnswered 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-none' 
                  : 'opacity-50'
              }`}
            >
              🎉 Finish & Submit
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex items-center gap-1.5 px-8 font-bold disabled:opacity-50"
            >
              Next Question →
            </Button>
          )}

        </div>

      </div>
    </Layout>
  );
}
