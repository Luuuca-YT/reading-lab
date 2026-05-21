import { useState, useMemo } from 'react';
import { authFetch } from '../context/AuthContext';
import { CatAvatar, cats, getDialogue } from './CatAvatar';
import { synth } from '../utils/audio';

const CONFIDENCE_OPTIONS = [
  { emoji: '💤', label: 'Almost none', expression: 'sleepy' as const, sub: 'Not confident at all...' },
  { emoji: '🐌', label: 'A little', expression: 'sad' as const, sub: 'A tiny bit nervous' },
  { emoji: '🚶', label: 'Some', expression: 'neutral' as const, sub: 'Feeling okay-ish' },
  { emoji: '🏃', label: 'A lot', expression: 'happy' as const, sub: 'Pretty confident!' },
  { emoji: '🚀', label: 'A whole lot', expression: 'excited' as const, sub: 'Absolutely ready!' },
];

interface Props {
  sessionId: number;
  phase: 'before' | 'after';
  onSubmit: () => void;
  buttonLabel?: string;
  selectedCatId?: string;
  activeCostume?: 'astronaut' | 'pirate' | 'sunglasses' | 'wizard' | 'crown' | null;
}

export function ConfidenceCheck({
  sessionId,
  phase,
  onSubmit,
  buttonLabel = 'Continue',
  selectedCatId,
  activeCostume = null
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hoveredOptIdx, setHoveredOptIdx] = useState<number | null>(null);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      await authFetch(`/api/sessions/${sessionId}/confidence`, {
        method: 'POST',
        body: JSON.stringify({ phase, confidence: selected }),
      });
      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
      setSubmitting(false);
    }
  }

  const activeCat = useMemo(() => {
    const catId = selectedCatId || 'leo';
    return cats.find(c => c.id === catId) || cats[0];
  }, [selectedCatId]);

  // Dynamic encouraging dialogue based on active cat + selection state
  const dialogue = useMemo(() => {
    if (selected) {
      return getDialogue(activeCat.id, activeCostume, 'q1_understand', selected);
    }
    const fallback: Record<string, string> = {
      leo: 'How are you feeling today, space cadet? Be honest — every great explorer gets nervous sometimes! 🦁✨',
      luna: 'Take a deep breath, darling. How confident do you feel right now? Confidence is elegant! 🎀👑',
      milo: 'Mmm, how yummy does your reading energy feel today? Even a tiny bit counts! 🍩😻',
      shadow: 'The crystal ball awaits your truth, apprentice. How strong is your reading magic today? 🧙‍♂️🔮',
    };
    return fallback[activeCat.id] || fallback.leo;
  }, [selected, activeCat, activeCostume]);

  // Determine mascot expression
  const mascotExpression = useMemo(() => {
    if (hoveredOptIdx !== null) return CONFIDENCE_OPTIONS[hoveredOptIdx].expression;
    if (selected) {
      const opt = CONFIDENCE_OPTIONS.find(o => o.label === selected);
      if (opt) return opt.expression;
    }
    return 'neutral' as const;
  }, [hoveredOptIdx, selected]);

  return (
    <div className="w-full">
      <style>{`
        @keyframes conf-pop-bounce {
          0% { transform: scale(0.85) translateY(10px); opacity: 0; }
          70% { transform: scale(1.03) translateY(-3px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes conf-float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }
        @keyframes conf-glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.06); }
        }
        .conf-animate-pop { animation: conf-pop-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .conf-animate-float { animation: conf-float-slow 5s ease-in-out infinite; }
        .conf-animate-glow { animation: conf-glow-pulse 4s ease-in-out infinite; }
        .conf-btn-3d {
          transition: all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        .conf-btn-3d:active {
          transform: translateY(3px);
          border-bottom-width: 2px !important;
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start min-h-[440px]">
        {/* LEFT PANEL: Cat Mascot + Speech Bubble */}
        <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center bg-black/20 backdrop-blur-md rounded-3xl border border-white/10 p-5 md:p-6 text-center min-h-[380px] shadow-lg relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 filter blur-2xl conf-animate-glow bg-white/20" />

          {/* Speech Bubble */}
          <div
            key={dialogue}
            className="relative bg-white/95 border border-slate-200 rounded-2xl p-4 shadow-xl text-slate-800 font-extrabold text-sm md:text-base text-center max-w-sm w-full leading-relaxed conf-animate-pop mb-6 after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-[8px] after:border-transparent after:border-t-white/95 before:content-[''] before:absolute before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-[9px] before:border-transparent before:border-t-slate-200/90 z-10"
          >
            {dialogue}
          </div>

          {/* Cat Avatar Circle */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center conf-animate-float z-10">
            <div className="absolute inset-4 rounded-full bg-white/5 filter blur(6px)" />
            <CatAvatar
              catId={activeCat.id}
              expression={mascotExpression}
              activeCostume={activeCostume}
              className="w-full h-full p-2.5"
            />
          </div>

          {/* Cat name badge */}
          <div className="mt-4 z-10">
            <span className="inline-block rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-black text-white/80 backdrop-blur">
              {activeCat.emoji} {activeCat.name}
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Question + Options */}
        <div className="col-span-1 md:col-span-7 flex flex-col gap-5">
          {/* Question Header */}
          <div className="bg-black/20 rounded-3xl border border-white/5 p-5 md:p-6 shadow-md flex flex-col gap-2">
            <p className="text-xs font-black text-white/40 uppercase tracking-widest">
              {phase === 'before' ? 'Before today' : 'After today'}
            </p>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
              How{' '}
              <span className="inline-block px-3 py-1 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl shadow-md border border-white/10 bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                confident
              </span>{' '}
              do you feel as a reader?
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
              Pick the one that matches how you feel right now. There are no wrong answers — be honest!
            </p>
          </div>

          {/* Option Cards Grid — 5 columns on sm+, stack on mobile */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {CONFIDENCE_OPTIONS.map((opt, idx) => {
              const isSelected = selected === opt.label;
              const isHovered = hoveredOptIdx === idx;

              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    synth.playSelect();
                    setSelected(opt.label);
                  }}
                  onMouseEnter={() => {
                    synth.playHover();
                    setHoveredOptIdx(idx);
                  }}
                  onMouseLeave={() => setHoveredOptIdx(null)}
                  className={`conf-btn-3d flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-b-[5px] transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/20 border-b-emerald-600 shadow-md ring-4 ring-emerald-500/15 scale-[1.03] z-10'
                      : isHovered
                      ? 'border-white/30 bg-white/10 border-b-white/40 translate-y-[-2px] shadow-sm'
                      : 'border-white/10 bg-white/5 border-b-white/20'
                  }`}
                >
                  {/* Option number badge */}
                  <span
                    className={`h-5 w-5 flex items-center justify-center rounded-lg border text-[10px] font-black ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-500/30 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:border-white/20'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Cat face expressing this confidence level */}
                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center border-2 border-white/20 p-1.5 shadow-inner transition-all duration-250 ${
                      isSelected ? 'bg-white/20 scale-105 border-white/40' : 'bg-white/10 group-hover:scale-110'
                    }`}
                  >
                    <CatAvatar
                      catId={activeCat.id}
                      expression={opt.expression}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] sm:text-xs font-extrabold leading-tight text-center transition-colors ${
                      isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </span>

                  {/* Sub label — hidden on smallest screens */}
                  <span className="hidden sm:block text-[9px] font-bold text-slate-400/80 group-hover:text-slate-300/90 text-center leading-tight transition-colors">
                    {opt.sub}
                  </span>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow animate-bounce">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-200 text-center font-semibold backdrop-blur">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6 mt-4 border-t border-white/10">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className={`conf-btn-3d px-10 py-3.5 rounded-2xl border-b-[5px] font-extrabold text-base transition-all duration-150 shadow-lg ${
            selected && !submitting
              ? 'bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white border-b-emerald-700 shadow-emerald-500/25 active:translate-y-[3px] active:border-b-2'
              : 'bg-white/10 text-white/30 border-b-white/20 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : buttonLabel}
        </button>
      </div>
    </div>
  );
}
