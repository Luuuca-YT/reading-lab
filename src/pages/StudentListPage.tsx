import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { students as studentsApi } from '../db';
import type { Student } from '../db';

export function StudentListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [list, setList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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
              <button
                key={s.id}
                onClick={() => navigate(`/students/${s.id}`)}
                className="rounded-2xl border border-bluebook-100 bg-white p-6 text-left transition-all hover:border-bluebook-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-subhead text-bluebook-900">
                      {s.name}
                    </div>
                    <div className="mt-1 text-sm text-bluebook-400">
                      {[s.grade, s.age && `Age ${s.age}`]
                        .filter(Boolean)
                        .join(' · ') || 'No details'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-bluebook-50 px-3 py-1 text-sm font-medium text-bluebook-600">
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
