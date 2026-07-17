'use client';

import { useState } from 'react';
import { fetchJson } from '@/lib/api';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetchJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layer-card rounded-4xl border border-slate-700/70 bg-slate-950/80 p-8 shadow-soft sm:max-w-md">
      <h2 className="text-2xl font-semibold text-white">Přihlášení</h2>
      <p className="mt-2 text-sm text-slate-400">Zadejte své přihlašovací údaje pro vstup do klientského dashboardu.</p>
      {error ? <div className="mt-5 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-400">
          Uživatelské jméno
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </label>
        <label className="block text-sm text-slate-400">
          Heslo
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Probíhá přihlášení…' : 'Přihlásit se'}
        </button>
      </form>
    </div>
  );
}
