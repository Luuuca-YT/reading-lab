import { useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const API = import.meta.env.VITE_API_URL || '';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      // Direct fetch — no context, no middleware
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Login failed (${res.status})`);
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('admin', JSON.stringify(data.admin));

      // Force a full page reload so all contexts pick up the token cleanly
      window.location.hash = '#/';
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center">
          <h1 className="text-display text-bluebook-900">Reading Lab</h1>
          <p className="mt-3 text-body text-bluebook-400">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
