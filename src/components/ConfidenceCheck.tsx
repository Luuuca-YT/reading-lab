import { useState } from 'react';
import { authFetch } from '../context/AuthContext';
import { Button } from './Button';

const CONFIDENCE_OPTIONS = [
  { emoji: '🙁', label: 'Almost none' },
  { emoji: '😕', label: 'A little' },
  { emoji: '😐', label: 'Some' },
  { emoji: '🙂', label: 'A lot' },
  { emoji: '😄', label: 'A whole lot' },
];

interface Props {
  sessionId: number;
  phase: 'before' | 'after';
  onSubmit: () => void;
  buttonLabel?: string;
}

export function ConfidenceCheck({ sessionId, phase, onSubmit, buttonLabel = 'Continue' }: Props) {
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
        <p className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-2">
          {phase === 'before' ? 'Before today' : 'After today'}
        </p>
        <h2 className="text-heading text-bluebook-900">
          How <span className="font-bold">confident</span> do you feel as a reader?
        </h2>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {CONFIDENCE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              onClick={() => setSelected(opt.label)}
              className={`flex flex-col items-center justify-between rounded-xl border-2 px-2 py-4 transition-all min-h-[140px] ${
                isSelected
                  ? 'border-bluebook-500 bg-bluebook-50 ring-2 ring-bluebook-500/20 shadow-sm'
                  : 'border-bluebook-100 bg-white hover:border-bluebook-300 hover:bg-bluebook-50/30'
              }`}
            >
              <span className="text-5xl mb-3 leading-none select-none">{opt.emoji}</span>
              <span
                className={`text-xs sm:text-sm text-center leading-tight ${
                  isSelected ? 'text-bluebook-700 font-medium' : 'text-bluebook-600'
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button size="lg" onClick={handleSubmit} disabled={!selected || submitting} className="min-w-[200px]">
          {submitting ? 'Saving...' : buttonLabel}
        </Button>
      </div>
    </div>
  );
}
