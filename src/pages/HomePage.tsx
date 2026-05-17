import { useNavigate } from 'react-router-dom';

function CardButton({
  icon, title, desc, highlight, onClick,
}: {
  icon: string; title: string; desc: string; highlight?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-56 flex-col items-center gap-4 rounded-2xl border-2 border-bluebook-100 bg-white p-8 text-left transition-all hover:border-bluebook-300 hover:shadow-lg"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110 ${
          highlight ? 'bg-bluebook-700 text-white' : 'bg-bluebook-50 text-bluebook-700'
        }`}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-subhead text-bluebook-900">{title}</div>
        <div className="mt-1 text-sm text-bluebook-400">{desc}</div>
      </div>
    </button>
  );
}

function todayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-10 bg-white px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-display text-bluebook-900">Reading Lab</h1>
        <p className="text-body text-bluebook-900/50">
          A focused tool for reading assessment
        </p>
      </div>

      <div className="flex gap-5">
        <CardButton
          icon="+"
          title="New Session"
          desc="Start a reading session with a student"
          highlight
          onClick={() => navigate('/session/setup')}
        />
        <CardButton
          icon="👥"
          title="Students"
          desc="View all students and their progress"
          onClick={() => navigate('/students')}
        />
        <CardButton
          icon="📚"
          title="Articles"
          desc="Manage reading articles"
          onClick={() => navigate('/articles')}
        />
        <CardButton
          icon="📊"
          title="Data Explorer"
          desc="Analyze student reading data"
          onClick={() => navigate('/admin')}
        />
      </div>

      <div className="text-sm text-bluebook-900/30">{todayString()}</div>
    </div>
  );
}
