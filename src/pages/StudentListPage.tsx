import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { students as studentsApi } from '../db';
import type { Student } from '../db';

export function StudentListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [list, setList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentsApi.remove(deleteTarget.id);
      setList((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast('Student deleted', 'success');
      setDeleteTarget(null);
    } catch {
      toast('Failed to delete student', 'error');
    }
    setDeleting(false);
  }

  useEffect(() => {
    studentsApi
      .getAll()
      .then((data) => {
        setList(data);
        setLoading(false);
      })
      .catch(() => {
        toast('Failed to load students', 'error');
        setLoading(false);
      });
  }, [toast]);

  return (
    <Layout title="Students" backTo="/">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-20">
          <p className="text-body text-bluebook-400">
            No students yet. Create your first student to get started.
          </p>
          <Button onClick={() => navigate('/students/new')}>
            + New Student
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-bluebook-400">
              {list.length} student{list.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={() => navigate('/students/new')}>
              + New Student
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {list.map((s) => (
              <div
                key={s.id}
                className="group rounded-2xl border border-bluebook-100 bg-white p-6 transition-all hover:border-bluebook-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => navigate(`/students/${s.id}`)}
                    className="flex-1 text-left"
                  >
                    <div className="text-subhead text-bluebook-900 group-hover:text-bluebook-700">
                      {s.name}
                    </div>
                    <div className="mt-1 text-sm text-bluebook-400">
                      {[s.grade, s.age && `Age ${s.age}`]
                        .filter(Boolean)
                        .join(' · ') || 'No details'}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                      className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="rounded-lg bg-bluebook-50 px-3 py-1 text-sm font-medium text-bluebook-600 hover:bg-bluebook-100 transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteTarget?.name ?? ''}? This will permanently remove all sessions, recordings, and data. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}