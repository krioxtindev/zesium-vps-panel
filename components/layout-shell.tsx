'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import LoginForm from '@/components/login-form';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        await fetchJson('/api/auth/me');
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      }
    }

    check();
  }, []);

  if (authenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Načítám...</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950/90 px-4 py-10">
        <LoginForm onSuccess={() => setAuthenticated(true)} />
      </div>
    );
  }

  return <>{children}</>;
}
