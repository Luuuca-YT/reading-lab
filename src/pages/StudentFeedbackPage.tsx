import { useState } from 'react';
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
  options: Option[];
}

const questions: Question[] = [
  {
    key: 'q1_understand',
    label: 'How much {h} did you put in while reading this passage?',
    highlight: 'effort',
    options: [
      { emoji: '😴', label: 'Almost none' },
      { emoji: '🥱', label: 'A little' },
      { emoji: '🤔', label: 'Some' },
      { emoji: '😤', label: 'A lot' },
      { emoji: '🧠', label: 'A whole lot' },
    ],
  },
  {
    key: 'q2_difficulty',
    label: 'How {h} was it for you to read this passage?',
    highlight: 'hard',
    options: [
      { emoji: '😉', label: 'Very easy' },
      { emoji: '😌', label: 'Easy' },
      { emoji: '😑', label: 'Medium' },
      { emoji: '😓', label: 'Hard' },
      { emoji: '😩', label: 'Very Hard' },
    ],
  },
  {
    key: 'q3_interest',
    label: 'How much did you {h} reading this passage?',
    highlight: 'enjoy',
    options: [
      { emoji: '🙁', label: 'Did not want to finish it' },
      { emoji: '😕', label: 'Not very fun' },
      { emoji: '😐', label: 'It was okay' },
      { emoji: '🙂', label: 'I enjoyed it' },
      { emoji: '😄', label: 'Great! I want to read more!' },
    ],
  },
  {
    key: 'q4_effort',
    label: 'How much did you {h} about this topic before reading this passage?',
    highlight: 'already know',
    options: [
      { emoji: '🙁', label: 'I knew nothing about it' },
      { emoji: '😕', label: 'I knew a little' },
      { emoji: '😐', label: 'I knew some things' },
      { emoji: '🙂', label: 'I knew a lot' },
      { emoji: '😄', label: 'I already knew everything about it' },
    ],
  },
];

function QuestionLabel({ q, index }: { q: Question; index: number }) {
  const [before, after] = q.label.split('{h}');
  return (
    <h3 className="text-lg text-bluebook-900 mb-4">
      <span className="font-semibold mr-2">{index + 1}.</span>
      {before}
      <span className="font-bold">{q.highlight}</span>
      {after}
    </h3>
  );
}

export function StudentFeedbackPage() {
  const { id, articleOrder } = useParams<{ id: string; articleOrder: string }>();
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const order = Number(articleOrder);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const allAnswered = questions.every((q) => answers[q.key]);

  function handleSubmit() {
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

  return (
    <Layout title={`Student Feedback · Article ${order}`} backTo={`/session/${id}/read/${order}`}>
      <div className="mx-auto max-w-4xl py-8 space-y-10">
        <div className="text-center mb-2">
          <p className="text-sm font-medium text-bluebook-400 uppercase tracking-wide mb-2">
            After every passage
          </p>
          <h2 className="text-heading text-bluebook-900">Tap how you felt about the reading</h2>
        </div>

        {questions.map((q, qIdx) => {
          const selected = answers[q.key] ?? '';
          return (
            <div key={q.key}>
              <QuestionLabel q={q} index={qIdx} />
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setAnswer(q.key, opt.label)}
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
            </div>
          );
        })}

        <div className="flex justify-center pt-4 pb-12">
          <Button size="lg" onClick={handleSubmit} disabled={!allAnswered} className="min-w-[200px]">
            {allAnswered ? 'Submit' : `${questions.filter((q) => answers[q.key]).length} of ${questions.length} answered`}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
