'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import type { VmRecord, UserRecord } from '@/lib/types';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vms, setVms] = useState<VmRecord[]>([]);
  const [selected, setSelected] = useState('');
  const [vmids, setVmids] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const data = await fetchJson<{ users: UserRecord[]; vms: VmRecord[] }>('/api/admin/users');
        setUsers(data.users);
        setVms(data.vms);
        setSelected(data.users[0]?.id ?? '');
      } catch (error) {
        setMessage((error as Error).message);
      }
    }

    loadAdminData();
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    const payload = { userId: selected, vmids: vmids.split(',').map((id) => Number(id.trim())).filter(Boolean) };
    try {
      await fetchJson('/api/admin/users', { method: 'PATCH', body: JSON.stringify(payload) });
      setMessage('Uživatel úspěšně upraven.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-4xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-soft">
        <h1 className="text-3xl font-semibold text-white">Admin přehled</h1>
        <p className="mt-2 text-sm text-slate-400">Zde můžete spravovat uživatele a jejich přiřazené VM.</p>
      </div>

      {message ? <div className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="layer-card rounded-3xl border p-6">
          <h2 className="text-xl font-semibold text-white">Uživatelé</h2>
          <div className="mt-4 space-y-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4">
                <p className="text-sm text-slate-400">{user.displayName} ({user.username})</p>
                <p className="mt-2 text-sm text-slate-200">VMID: {user.vmids.join(', ') || 'Žádné'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="layer-card rounded-3xl border p-6">
          <h2 className="text-xl font-semibold text-white">VM zařízení</h2>
          <div className="mt-4 space-y-4">
            {vms.map((vm) => (
              <div key={vm.vmid} className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4">
                <p className="text-sm text-slate-400">{vm.name}</p>
                <p className="mt-2 text-sm text-slate-200">ID: {vm.vmid} · {vm.node} · {vm.ip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-4xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-white">Upravit přiřazení VM</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-400">
            Vyber uživatele
            <select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none">
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.displayName}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-400">
            VM ID seznam
            <input value={vmids} onChange={(event) => setVmids(event.target.value)} placeholder="101, 102" className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none" />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={handleSave} className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Uložit změny
          </button>
        </div>
      </div>
    </div>
  );
}
