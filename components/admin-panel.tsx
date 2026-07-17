'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api';
import type { VmRecord, UserRecord } from '@/lib/types';

interface AdminConfig {
  proxmoxApiUrl: string;
  proxmoxApiToken: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vms, setVms] = useState<VmRecord[]>([]);
  const [selected, setSelected] = useState('');
  const [vmids, setVmids] = useState('');
  const [config, setConfig] = useState<AdminConfig>({ proxmoxApiUrl: '', proxmoxApiToken: '' });
  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', role: 'client' as 'client' | 'admin' });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const data = await fetchJson<{ users: UserRecord[]; vms: VmRecord[] }>('/api/admin/users');
        setUsers(data.users);
        setVms(data.vms);
        setSelected(data.users[0]?.id ?? '');

        const configData = await fetchJson<AdminConfig>('/api/admin/config');
        setConfig(configData);
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

  const handleConfigSave = async () => {
    try {
      await fetchJson('/api/admin/config', { method: 'POST', body: JSON.stringify(config) });
      setMessage('Konfigurace Proxmox API byla uložena.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleCreateUser = async () => {
    try {
      await fetchJson('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setMessage('Uživatel vytvořen.');
      setNewUser({ username: '', displayName: '', password: '', role: 'client' });
      const data = await fetchJson<{ users: UserRecord[]; vms: VmRecord[] }>('/api/admin/users');
      setUsers(data.users);
      setSelected(data.users[0]?.id ?? '');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-4xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-soft">
        <h1 className="text-3xl font-semibold text-white">Admin přehled</h1>
        <p className="mt-2 text-sm text-slate-400">Zde můžete spravovat uživatele, VM a Proxmox konfiguraci.</p>
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
        <h2 className="text-xl font-semibold text-white">Konfigurace Proxmox API</h2>
        <p className="mt-2 text-sm text-slate-400">Zde můžete uložit adresu a token pro přístup k Proxmox API.</p>
        <div className="mt-5 grid gap-4">
          <label className="space-y-2 text-sm text-slate-400">
            Proxmox API URL
            <input
              value={config.proxmoxApiUrl}
              onChange={(event) => setConfig((current) => ({ ...current, proxmoxApiUrl: event.target.value }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-400">
            Proxmox API Token
            <input
              type="password"
              value={config.proxmoxApiToken}
              onChange={(event) => setConfig((current) => ({ ...current, proxmoxApiToken: event.target.value }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            />
          </label>
          <div className="flex justify-end">
            <button onClick={handleConfigSave} className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Uložit konfiguraci
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-4xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-white">Vytvořit nového uživatele</h2>
        <p className="mt-2 text-sm text-slate-400">Přidejte klienta nebo administrátora pro lokální login.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-400">
            Uživatelské jméno
            <input
              value={newUser.username}
              onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-400">
            Zobrazované jméno
            <input
              value={newUser.displayName}
              onChange={(event) => setNewUser((current) => ({ ...current, displayName: event.target.value }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-400">
            Heslo
            <input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-400">
            Role
            <select
              value={newUser.role}
              onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as 'client' | 'admin' }))}
              className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-white outline-none"
            >
              <option value="client">Klient</option>
              <option value="admin">Administrátor</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={handleCreateUser} className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
            Vytvořit uživatele
          </button>
        </div>
      </div>
    </div>
  );
}
