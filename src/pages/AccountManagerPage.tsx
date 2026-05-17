import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { PageSpinner } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { adminAccounts } from '../db';

interface Account {
  id: number;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
}

export function AccountManagerPage() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newDisplay, setNewDisplay] = useState('');
  const [newRole, setNewRole] = useState('tutor');

  function load() {
    return adminAccounts.list().then(setAccounts).catch(() => { toast('Failed to load accounts', 'error'); });
  }

  useEffect(() => { load().then(() => setLoading(false)).catch(() => setLoading(false)); }, []);

  async function handleCreate() {
    if (!newUser.trim() || !newPass.trim()) {
      toast('Username and password required', 'error');
      return;
    }
    try {
      await adminAccounts.create({
        username: newUser.trim(),
        password: newPass,
        displayName: newDisplay.trim() || newUser.trim(),
        role: newRole,
      });
      toast('Account created', 'success');
      setNewUser(''); setNewPass(''); setNewDisplay('');
      load();
    } catch (e: any) {
      toast(e.message || 'Failed to create', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this account?')) return;
    try {
      await adminAccounts.remove(id);
      toast('Account deleted', 'success');
      load();
    } catch (e: any) {
      toast(e.message || 'Failed to delete', 'error');
    }
  }

  return (
    <Layout title="Account Manager" backTo="/">
      <div className="mx-auto max-w-2xl space-y-6">
        {loading ? <PageSpinner /> : (
          <>
            {admin?.role === 'admin' && (
              <div className="rounded-2xl border border-bluebook-100 bg-white p-6 space-y-4">
                <h2 className="text-subhead text-bluebook-900">Create New Account</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Username" value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="tutor1" />
                  <Input label="Password" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••" />
                  <Input label="Display Name" value={newDisplay} onChange={(e) => setNewDisplay(e.target.value)} placeholder="Ms. Johnson" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-bluebook-400 uppercase tracking-wide">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="rounded-xl border border-bluebook-200 bg-white px-4 py-3 text-body text-bluebook-900"
                    >
                      <option value="tutor">Tutor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleCreate}>Create Account</Button>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-subhead text-bluebook-900">All Accounts ({accounts.length})</h2>
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-bluebook-100 bg-white px-5 py-4">
                  <div>
                    <div className="font-medium text-bluebook-900">
                      {a.display_name || a.username}
                      {a.role === 'admin' && (
                        <span className="ml-2 rounded-full bg-bluebook-100 px-2 py-0.5 text-xs font-medium text-bluebook-600">Admin</span>
                      )}
                    </div>
                    <div className="text-sm text-bluebook-400">@{a.username} · {a.role}</div>
                  </div>
                  {admin?.role === 'admin' && a.id !== admin.id && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(a.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
