'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cpu, Server, Power, Circle } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { VmRecord, ProxmoxStatus } from '@/lib/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface VmDashboardItem extends VmRecord {
  status: ProxmoxStatus | null;
}

const statusLabel = (status: ProxmoxStatus | null) => {
  if (!status) return { text: 'Neznámý', color: 'text-slate-400', dot: 'bg-slate-500' };
  if (status.status === 'running') return { text: 'Běží', color: 'text-emerald-400', dot: 'bg-emerald-500' };
  if (status.status === 'stopped') return { text: 'Vypnuto', color: 'text-slate-400', dot: 'bg-slate-500' };
  return { text: 'Neznámý', color: 'text-amber-300', dot: 'bg-amber-500' };
};

const cpuSample = Array.from({ length: 8 }, (_, index) => ({ timestamp: index, value: Math.round(10 + Math.random() * 65) }));

export default function Dashboard() {
  const [vms, setVms] = useState<VmDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVms() {
      try {
        const data = await fetchJson<{ vms: VmDashboardItem[] }>('/api/vms');
        setVms(data.vms);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadVms();
  }, []);

  const summary = useMemo(() => ({
    total: vms.length,
    running: vms.filter((vm) => vm.status?.status === 'running').length,
    stopped: vms.filter((vm) => vm.status?.status === 'stopped').length,
  }), [vms]);

  const handleAction = async (vmid: number, action: 'start' | 'stop') => {
    try {
      await fetchJson(`/api/vms/${vmid}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setVms((current) =>
        current.map((item) =>
          item.vmid === vmid
            ? {
                ...item,
                status: item.status ? { ...item.status, status: action === 'start' ? 'running' : 'stopped' } : item.status,
              }
            : item
        )
      );
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Client Area</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Přehled vašich VPS</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Jednoduchý přehled vašich VPS s rychlým ovládáním a současným stavem.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="layer-card rounded-3xl border px-5 py-4">
            <p className="text-sm text-slate-400">Celkem VPS</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.total}</p>
          </div>
          <div className="layer-card rounded-3xl border px-5 py-4">
            <p className="text-sm text-slate-400">Běží</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{summary.running}</p>
          </div>
          <div className="layer-card rounded-3xl border px-5 py-4">
            <p className="text-sm text-slate-400">Vypnuto</p>
            <p className="mt-2 text-2xl font-semibold text-slate-200">{summary.stopped}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
          Chyba: {error}
        </div>
      ) : null}

      {loading ? (
        <div className="layer-card rounded-3xl border p-8 text-center text-slate-400">Načítání dat...</div>
      ) : (
        <div className="space-y-5">
          {vms.map((vm) => {
            const status = statusLabel(vm.status);
            return (
              <div key={vm.vmid} className="layer-card rounded-3xl border p-6 shadow-soft">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/50 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        <Server className="h-3.5 w-3.5" /> {vm.name}
                      </span>
                      <span className="text-slate-500"># {vm.vmid}</span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <Circle className={`h-2.5 w-2.5 ${status.dot}`} />
                        <span className={status.color}>{status.text}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-sm text-slate-300">
                        IP: <span className="text-white">{vm.ip}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Cpu className="h-4 w-4 text-cyan-300" />
                        CPU usage: <span className="text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:w-2/5">
                    <div className="rounded-3xl bg-slate-950/80 px-4 py-4">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>CPU historie</span>
                        <span className="text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : '—'}</span>
                      </div>
                      <div className="mt-4 h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cpuSample}>
                            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-950/80 px-4 py-4">
                      <div>
                        <p className="text-sm text-slate-400">Ovládání</p>
                        <p className="mt-2 text-xs text-slate-500">Start / Stop rychle</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(vm.vmid, 'start')}
                          className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => handleAction(vm.vmid, 'stop')}
                          className="rounded-2xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
