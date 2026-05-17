import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Input, Textarea } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { students } from '../db';

export function StudentSetupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }

    setSaving(true);
    try {
      const s = await students.create({
        name: name.trim(),
        age: age ? Number(age) : undefined,
        grade: grade.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast('Student created', 'success');
      navigate(`/students/${s.id}`);
    } catch {
      setError('Failed to save. Please try again.');
      toast('Failed to save student', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="New Student" backTo="/">
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-8">
        <div className="space-y-5">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              type="number"
              placeholder="e.g. 9"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Input
              label="Grade"
              placeholder="e.g. 3rd"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          <Textarea
            label="Notes"
            placeholder="Any additional notes about this student..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
