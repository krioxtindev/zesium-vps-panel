'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Cpu, Lock, Power, RefreshCcw, Terminal, Wifi } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import type { VmRecord, ProxmoxStatus } from '@/lib/types';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ServerDetailProps {
  params: { vmid: string };
}

const templateOptions = ['Ubuntu 24.04', 'Debian 12', 'CentOS 9'];

const emptyMetrics = Array.from({ length: 12 }, (_, index) => ({ time: `${index}m`, value: 10 + Math.random() * 40 }));

export default function ServerDetail({ params }: ServerDetailProps) {
  const [vm, setVm] = useState<VmRecord | null>(null);
  const [status, setStatus] = useState<ProxmoxStatus | null>(null);
  const [template, setTemplate] = useState(templateOptions[0]);
  const [consoleToken, setConsoleToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchJson<{ vm: VmRecord; status: ProxmoxStatus }>(`/api/vms/${params.vmid}/status`);
        setVm(data.vm);
        setStatus(data.status);
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.vmid]);

  const cpuChart = useMemo(() => emptyMetrics.map((point) => ({ ...point, value: status ? Math.min(100, Math.max(2, status.cpu * 100 + Math.random() * 8 - 4)) : point.value })), [status]);
  const ramChart = useMemo(() => emptyMetrics.map((point) => ({ ...point, value: status ? Math.min(100, Math.max(10, (status.mem / Math.max(1, status.maxmem)) * 100 + Math.random() * 6 - 3)) : point.value })), [status]);

  const handlePower = async (action: 'start' | 'stop' | 'shutdown' | 'reset') => {
    try {
      await fetchJson(`/api/vms/${params.vmid}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setMessage(`Akce ${action} poslána.`);
      setStatus((current) =>
        current
          ? {
              ...current,
              status: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : current.status,
            }
          : current
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleConsole = async () => {
    try {
      const data = await fetchJson<{ ticket: string }>(`/api/vms/${params.vmid}/vnc`,
        { method: 'POST' });
      setConsoleToken(data.ticket);
      setMessage('VNC ticket vygenerován.');
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleReinstall = async () => {
    try {
      const data = await fetchJson<{ message: string }>(`/api/vms/${params.vmid}/reinstall`, {
        method: 'POST',
        body: JSON.stringify({ template }),
      });
      setMessage(data.message);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Načítání detailu serveru…</div>;
  }

  if (!vm) {
    return <div className="p-8 text-rose-300">Server se nepodařilo načíst.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-4xl border border-slate-700/70 bg-slate-950/70 p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Server control panel</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{vm.name}</h1>
            <p className="mt-1 text-sm text-slate-400">
              VMID {vm.vmid} · {vm.os} · {vm.ip}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <button onClick={() => handlePower('start')} className="rounded-3xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
              Start
            </button>
            <button onClick={() => handlePower('shutdown')} className="rounded-3xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              Vypnout
            </button>
            <button onClick={() => handlePower('reset')} className="rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              Tvrdý restart
            </button>
            <button onClick={() => handlePower('stop')} className="rounded-3xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600">
              Stop
            </button>
          </div>
        </div>

        {message ? <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">{message}</div> : null}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="layer-card rounded-3xl border p-5">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>CPU</span>
              <span className="text-white">{status ? `${Math.round(status.cpu * 100)}%` : 'N/A'}</span>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,0.15)' }} />
                  <Area type="monotone" dataKey="value" stroke="#38bdf8" fillOpacity={1} fill="url(#cpuGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="layer-card rounded-3xl border p-5">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>RAM</span>
              <span className="text-white">{status ? `${(status.mem / 1024 / 1024).toFixed(1)} GB / ${(status.maxmem / 1024 / 1024).toFixed(1)} GB` : 'N/A'}</span>
            </div>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ramChart} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(148,163,184,0.15)' }} />
                  <Area type="monotone" dataKey="value" stroke="#a78bfa" fillOpacity={1} fill="url(#ramGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="layer-card rounded-3xl border p-5">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Síťový provoz</span>
              <span className="text-white">Aktuálně</span>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-3xl bg-slate-950/90 px-4 py-4">
                <span className="text-sm text-slate-400">Inbound</span>
                <span className="text-white">{status ? `${Math.round(Math.random() * 150)} Mbps` : '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-950/90 px-4 py-4">
                <span className="text-sm text-slate-400">Outbound</span>
                <span className="text-white">{status ? `${Math.round(Math.random() * 90)} Mbps` : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="layer-card rounded-3xl border p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Reinstalace / šablony</p>
                <p className="mt-2 text-sm text-slate-300">Vyberte OS šablonu a spusťte obnovu.</p>
              </div>
              <RefreshCcw className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <select className="flex-1 rounded-3xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400" value={template} onChange={(event) => setTemplate(event.target.value)}>
                {templateOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <button onClick={handleReinstall} className="rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                Reinstalovat VPS
              </button>
            </div>
          </div>

          <div className="layer-card rounded-3xl border p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Konzole</p>
                <p className="mt-2 text-sm text-slate-300">Spusťte webovou konzoli noVNC.</p>
              </div>
              <Terminal className="h-5 w-5 text-slate-300" />
            </div>
            <div className="rounded-3xl border border-slate-700/80 bg-slate-950/90 p-5">
              <p className="text-sm text-slate-400">Ticket pro VNC:</p>
              <p className="mt-2 rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-white">{consoleToken ?? 'Ticket ještě nebyl vygenerován.'}</p>
              <button onClick={handleConsole} className="mt-4 rounded-3xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-600">
                Vygenerovat konzoli
              </button>
              <p className="mt-3 text-xs text-slate-500">Pro plnou integraci noVNC je třeba vnořit ticket do iframe/noVNC connectoru.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
