import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

interface Props {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}

export function Layout({ title, backTo, children }: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center gap-4 border-b border-bluebook-50 px-8 py-5">
        {backTo && (
          <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
            ← Back
          </Button>
        )}
        <h1 className="text-heading text-bluebook-900">{title}</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
