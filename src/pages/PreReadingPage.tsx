import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';
import { articles } from '../db';
import type { Article } from '../db';

export function PreReadingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    const articleId = session.articleIds[session.currentArticle - 1];
    if (articleId) {
      articles.getById(articleId).then((a) => setArticle(a ?? null));
    }
  }, [session.currentArticle, session.articleIds]);

  function handleStart() {
    navigate(`/session/${id}/read/${session.currentArticle}`);
  }

  return (
    <Layout title={`Day ${session.dayNumber} · Article ${session.currentArticle} of 3`} backTo={`/session/setup`}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-10 py-16 text-center">
        <div className="space-y-4">
          <div className="inline-block rounded-full bg-bluebook-100 px-5 py-2 text-sm font-medium text-bluebook-700">
            {session.studentName} · {session.tutorName}
          </div>
          <h1 className="text-heading text-bluebook-900">
            {article?.title ?? 'Loading...'}
          </h1>
        </div>

        <div className="rounded-2xl border border-bluebook-100 bg-bluebook-50/50 p-8 max-w-md">
          <p className="text-body text-bluebook-600 leading-relaxed">
            Please read the story aloud. Don't worry if you make mistakes or pause — just keep going. The tutor will help if needed.
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="secondary" size="lg" onClick={() => navigate(`/session/setup`)}>
            Go Back
          </Button>
          <Button size="lg" onClick={handleStart}>
            Start Reading
          </Button>
        </div>
      </div>
    </Layout>
  );
}
