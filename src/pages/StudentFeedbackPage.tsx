import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';

interface Option {
  emoji: string;
  label: string;
}

interface Question {
  key: string;
  label: string;
  highlight: string;
  description: string;
  themeColor: string;
  options: Option[];
}

const questions: Question[] = [
  {
    key: 'q1_understand',
    label: 'How much {h} did you put in while reading this passage?',
    highlight: 'effort',
    description: 'Did you concentrate and try your best to read clearly?',
    themeColor: 'emerald',
    options: [
      { emoji: '💤', label: 'Almost none' },
      { emoji: '🐌', label: 'A little' },
      { emoji: '🚶', label: 'Some' },
      { emoji: '🏃', label: 'A lot' },
      { emoji: '🚀', label: 'A whole lot' },
    ],
  },
  {
    key: 'q2_difficulty',
    label: 'How {h} was it for you to read this passage?',
    highlight: 'hard',
    description: 'Were the words and sentences easy or tough for you?',
    themeColor: 'purple',
    options: [
      { emoji: '🎈', label: 'Very easy' },
      { emoji: '🌱', label: 'Easy' },
      { emoji: '🚲', label: 'Medium' },
      { emoji: '🧗', label: 'Hard' },
      { emoji: '⛰️', label: 'Very Hard' },
    ],
  },
  {
    key: 'q3_interest',
    label: 'How much did you {h} reading this passage?',
    highlight: 'enjoy',
    description: 'Did you find the content fun and interesting to read?',
    themeColor: 'amber',
    options: [
      { emoji: '💔', label: 'Did not want to finish it' },
      { emoji: '🥱', label: 'Not very fun' },
      { emoji: '🍿', label: 'It was okay' },
      { emoji: '⭐', label: 'I enjoyed it' },
      { emoji: '🎉', label: 'Great! I want to read more!' },
    ],
  },
  {
    key: 'q4_effort',
    label: 'How much did you {h} about this topic before reading this passage?',
    highlight: 'already know',
    description: 'Was this topic brand new, or did you know a lot about it?',
    themeColor: 'blue',
    options: [
      { emoji: '❓', label: 'I knew nothing about it' },
      { emoji: '🔍', label: 'I knew a little' },
      { emoji: '📚', label: 'I knew some things' },
      { emoji: '🌍', label: 'I knew a lot' },
      { emoji: '👑', label: 'I already knew everything about it' },
    ],
  },
];

export function StudentFeedbackPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const order = Number(articleOrder);

  // Active question index state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentIdx];
  const selectedAnswer = answers[currentQuestion.key] ?? '';

  // Check if current question is answered
  const isCurrentAnswered = !!selectedAnswer;

  // Track total answered count
  const answeredCount = useMemo(() => {
    return questions.filter((q) => answers[q.key]).length;
  }, [answers]);

  const allAnswered = answeredCount === questions.length;

  function selectOption(optionLabel: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: optionLabel }));
    
    // Smooth auto-advance to next question if not the last slide
    if (currentIdx < questions.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 350); // small delay to let student see the feedback bounce animation
    }
  }

  function handleNext() {
    if (currentIdx < questions.length - 1) {
      setSlideDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 250); // match transition duration
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setSlideDirection('prev');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev - 1);
        setIsTransitioning(false);
      }, 250); // match transition duration
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
    navigate(`/session/${id}/tutor-feedback/${order}`);
  }

  // Parse label to highlight specific keyword with styled container
  const parsedLabel = useMemo(() => {
    const [before, after] = currentQuestion.label.split('{h}');
    return (
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
        {before}
        <span className={`inline-block mx-1.5 px-3 py-1 rounded-xl font-extrabold text-white transform rotate-[-1deg] shadow-sm select-none ${
          currentQuestion.themeColor === 'emerald' ? 'bg-emerald-500' :
          currentQuestion.themeColor === 'purple' ? 'bg-purple-500' :
          currentQuestion.themeColor === 'amber' ? 'bg-amber-500' :
          'bg-blue-500'
        }`}>
          {currentQuestion.highlight}
        </span>
        {after}
      </h2>
    );
  }, [currentQuestion]);

  return (
    <Layout title={`Student Feedback · Article ${order}`} backTo={`/session/${id}/read/${order}`}>
      {/* Self-contained high quality animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes bounce-short {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }
        @keyframes slide-in-next {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-prev {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
        .animate-bounce-short {
          animation: bounce-short 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .slide-enter-next {
          animation: slide-in-next 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .slide-enter-prev {
          animation: slide-in-prev 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
      `}</style>

      <div className="mx-auto max-w-4xl py-6 flex flex-col gap-6 select-none">
        
        {/* Top Gamified Header */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm font-bold text-slate-400 px-1">
            <span>PASSEGE REVIEW</span>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
          </div>

          {/* Gamified Duolingo-style Progress Bar */}
          <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Outer Interactive Content Container */}
        <div 
          className={`flex flex-col gap-6 transition-all duration-300 min-h-[50vh] ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          } ${
            slideDirection === 'next' ? 'slide-enter-next' : 'slide-enter-prev'
          }`}
        >
          {/* Main Question Presentation Card */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg flex flex-col gap-3 items-center justify-center py-10">
            {/* Soft decorative background circles */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-15 filter blur-xl ${
              currentQuestion.themeColor === 'emerald' ? 'bg-emerald-300' :
              currentQuestion.themeColor === 'purple' ? 'bg-purple-300' :
              currentQuestion.themeColor === 'amber' ? 'bg-amber-300' :
              'bg-blue-300'
            }`} />
            
            {/* Dynamic visual badge based on theme */}
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
              currentQuestion.themeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
              currentQuestion.themeColor === 'purple' ? 'bg-purple-500/10 text-purple-600' :
              currentQuestion.themeColor === 'amber' ? 'bg-amber-500/10 text-amber-600' :
              'bg-blue-500/10 text-blue-600'
            }`}>
              {currentIdx === 0 ? '🏃' : currentIdx === 1 ? '🧗' : currentIdx === 2 ? '🎉' : '🌍'}
            </div>

            {/* Structured Label */}
            {parsedLabel}
            
            {/* Helpful child description */}
            <p className="text-slate-400 text-sm max-w-lg mt-1 leading-relaxed">
              {currentQuestion.description}
            </p>
          </div>

          {/* Duolingo Option Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt.label;
              
              // Custom interactive option cards
              return (
                <button
                  key={opt.label}
                  onClick={() => selectOption(opt.label)}
                  className={`group relative flex flex-col items-center justify-between rounded-2xl border-b-[6px] border-2 p-5 transition-all min-h-[160px] active:scale-95 active:border-b-2 active:translate-y-[4px] duration-150 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 border-b-emerald-600 shadow-md ring-4 ring-emerald-500/15 scale-[1.03] animate-bounce-short z-10'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50 border-b-slate-300 hover:translate-y-[-2px] hover:shadow-sm'
                  }`}
                >
                  {/* Selected Indicator Checkmark */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow animate-scale-in">
                      ✓
                    </span>
                  )}

                  {/* Hotkey Number Badge */}
                  <span className={`absolute top-2 left-2 flex h-5.5 px-1.5 items-center justify-center rounded-md border text-[10px] font-extrabold ${
                    isSelected 
                      ? 'border-emerald-300 bg-emerald-100/60 text-emerald-600' 
                      : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:text-slate-500 group-hover:border-slate-300'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Gigantic Interactive Emoji Bubble */}
                  <div className="relative flex items-center justify-center w-20 h-20 mt-2">
                    {/* Pulsing ring behind selected emoji */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-300/40 rounded-full animate-pulse-soft" />
                    )}
                    <span className={`text-6xl select-none leading-none inline-block transition-transform duration-200 ${
                      isSelected 
                        ? 'scale-110 drop-shadow-md rotate-3' 
                        : 'group-hover:scale-115 group-hover:rotate-[-3deg]'
                    }`}>
                      {opt.emoji}
                    </span>
                  </div>

                  {/* Option Text Label */}
                  <span className={`text-xs sm:text-sm font-bold text-center leading-tight mt-3 px-1 transition-all ${
                    isSelected ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
                  }`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-4">
          {/* Back button */}
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-6"
          >
            ← Previous
          </Button>

          {/* Indicator dots */}
          <div className="hidden sm:flex gap-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIdx
                    ? 'w-6 bg-slate-600'
                    : answers[questions[idx].key]
                    ? 'w-2.5 bg-emerald-400'
                    : 'w-2.5 bg-slate-200'
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
              className={`px-8 flex items-center gap-2 shadow ${
                allAnswered 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 border-b-4 border-emerald-700 hover:translate-y-[1px] active:translate-y-[4px] active:border-b-0' 
                  : ''
              }`}
            >
              🎉 Finish & Submit
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex items-center gap-2 px-8"
            >
              Next Question →
            </Button>
          )}
        </div>

      </div>
    </Layout>
  );
}
