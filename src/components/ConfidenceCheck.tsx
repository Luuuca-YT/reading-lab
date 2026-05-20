import { useState } from 'react';
import { authFetch } from '../context/AuthContext';
import { Button } from './Button';
import { CatAvatar } from './CatAvatar';

const CONFIDENCE_OPTIONS = [
  { emoji: '🙁', label: 'Almost none', expression: 'sleepy' as const },
  { emoji: '😕', label: 'A little', expression: 'sad' as const },
  { emoji: '😐', label: 'Some', expression: 'neutral' as const },
  { emoji: '🙂', label: 'A lot', expression: 'happy' as const },
  { emoji: '😄', label: 'A whole lot', expression: 'excited' as const },
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

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">
          {phase === 'before' ? 'Before today' : 'After today'}
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
          How <span className="text-indigo-600">confident</span> do you feel as a reader?
        </h2>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-3xl mx-auto">
        {CONFIDENCE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              onClick={() => setSelected(opt.label)}
              className={`flex flex-col items-center justify-between rounded-2xl border-b-4 p-3 transition-all duration-300 select-none min-h-[160px] ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 scale-105 shadow-md translate-y-[-2px]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 hover:translate-y-[-1px]'
              }`}
            >
              {selectedCatId ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 flex-shrink-0 transition-transform duration-300 hover:scale-115">
                  <CatAvatar
                    catId={selectedCatId}
                    expression={opt.expression}
                    activeCostume={activeCostume}
                  />
                </div>
              ) : (
                <span className="text-5xl mb-3 leading-none select-none">{opt.emoji}</span>
              )}
              
              <span
                className={`text-[10px] sm:text-xs text-center font-black leading-tight tracking-wide ${
                  isSelected ? 'text-indigo-700' : 'text-slate-600'
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center font-medium border border-red-100 max-w-md mx-auto">
          {error}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={handleSubmit} disabled={!selected || submitting} className="min-w-[200px] shadow-lg shadow-indigo-600/20 font-black">
          {submitting ? 'Saving...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
}

