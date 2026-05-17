import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Input, Textarea } from '../components/Input';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { articles as articlesApi } from '../db';
import type { Article } from '../db';

export function ArticleManagerPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState('1');
  const [storyGroup, setStoryGroup] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  function loadArticles() {
    return articlesApi.getAll().then(setArticles).catch(() => { toast('Failed to load', 'error'); });
  }

  useEffect(() => {
    loadArticles().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setTitle('');
    setContent('');
    setDifficulty('1');
    setStoryGroup('');
    setSortOrder('0');
    setEditing(null);
    setShowNew(false);
  }

  function startEdit(a: Article) {
    setEditing(a);
    setShowNew(false);
    setTitle(a.title);
    setContent(a.content);
    setDifficulty(String(a.difficulty));
    setStoryGroup(a.story_group ?? '');
    setSortOrder(String(a.sort_order));
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await articlesApi.update(editing.id, {
          title: title.trim(),
          content: content.trim(),
          difficulty: Number(difficulty),
          story_group: storyGroup.trim() || undefined,
          sort_order: Number(sortOrder),
        });
        toast('Article updated', 'success');
      } else {
        await articlesApi.create({
          title: title.trim(),
          content: content.trim(),
          difficulty: Number(difficulty),
          story_group: storyGroup.trim() || undefined,
          sort_order: Number(sortOrder),
        });
        toast('Article created', 'success');
      }
      loadArticles();
      resetForm();
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this article?')) return;
    try {
      await articlesApi.remove(id);
      toast('Article deleted', 'success');
      loadArticles();
    } catch {
      toast('Failed to delete', 'error');
    }
  }

  return (
    <Layout title="Article Manager" backTo="/">
      <div className="mx-auto max-w-2xl space-y-6">
        {loading ? (
          <PageSpinner />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-bluebook-400">{articles.length} articles</p>
              {!showNew && !editing && (
                <Button size="sm" onClick={() => setShowNew(true)}>+ New Article</Button>
              )}
            </div>

            {/* Form */}
            {(showNew || editing) && (
              <div className="space-y-4 rounded-2xl border border-bluebook-100 bg-white p-6">
                <h2 className="text-subhead text-bluebook-900">
                  {editing ? 'Edit Article' : 'New Article'}
                </h2>
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
                <Textarea label="Content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Article text..." />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Difficulty (1-5)" type="number" min="1" max="5" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
                  <Input label="Story Group" value={storyGroup} onChange={(e) => setStoryGroup(e.target.value)} placeholder="e.g. A" />
                  <Input label="Sort Order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={resetForm}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            )}

            {/* Article list */}
            <div className="space-y-3">
              {articles.map((a) => (
                <div key={a.id} className="rounded-xl border border-bluebook-100 bg-white px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-bluebook-900">{a.title}</div>
                      <div className="mt-1 flex gap-3 text-sm text-bluebook-400">
                        <span>Difficulty: {a.difficulty}</span>
                        {a.story_group && <span>Group: {a.story_group}</span>}
                        <span>Order: {a.sort_order}</span>
                      </div>
                      <div className="mt-2 text-sm text-bluebook-500 line-clamp-2">
                        {a.content.slice(0, 120)}...
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)} className="text-red-500 hover:bg-red-50">Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
