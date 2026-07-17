'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cpu, Download, Server, Sparkles, Upload, ArrowRight, Pause, Play } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { VmRecord, ProxmoxStatus } from '@/lib/types';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface VmDashboardItem extends VmRecord {
  status: ProxmoxStatus | null;
}

const statusLabel = (status: ProxmoxStatus | null) => {
  if (!status) return { text: 'Neznámý', color: 'text-slate-400', bg: 'bg-slate-800' };
  if (status.status === 'running') return { text: 'Online', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
  if (status.status === 'stopped') return { text: 'Offline', color: 'text-slate-400', bg: 'bg-slate-700/80' };
  return { text: 'Unknown', color: 'text-amber-300', bg: 'bg-amber-500/10' };
};

const cpuSample = Array.from({ length: 8 }, (_, index) => ({ time: `${index}m`, value: Math.round(15 + Math.random() * 50) }));

export default function DashboardV2() {
  const [vms, setVms] = useState<VmDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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

  const filteredVms = useMemo(() => {
    if (!query.trim()) return vms;
    return vms.filter((vm) => vm.name.toLowerCase().includes(query.toLowerCase()) || String(vm.vmid).includes(query));
  }, [query, vms]);

  const summary = useMemo(
    () => ({
      total: vms.length,
      active: vms.filter((vm) => vm.status?.status === 'running').length,
      bandwidth: vms.length * 37.8,
      tickets: 0,
    }),
    [vms]
  );

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
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <div className="rounded-4xl border border-slate-800/90 bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.34em] text-slate-500">Dashboard</p>
            <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-white">Welcome back, Krioxtin</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Přehled všech služeb, rychlé akce a současné využití VPS bez složitého Proxmox UI.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  <Sparkles className="h-4 w-4" /> Order Service
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-700/90 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                  Support
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-4xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Total Services</p>
              <p className="mt-4 text-4xl font-semibold text-white">{summary.total}</p>
              <p className="mt-2 text-sm text-slate-400">Všechny tvoje VPS služby na jednom místě.</p>
            </div>
            <div className="rounded-4xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Active</p>
              <p className="mt-4 text-4xl font-semibold text-emerald-400">{summary.active}</p>
              <p className="mt-2 text-sm text-slate-400">Online servery momentálně běží.</p>
            </div>
            <div className="rounded-4xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Bandwidth Used</p>
              <p className="mt-4 text-4xl font-semibold text-sky-400">{summary.bandwidth.toFixed(1)} GB</p>
              <p className="mt-2 text-sm text-slate-400">Odvozeno z aktuálních služeb.</p>
            </div>
            <div className="rounded-4xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-lg">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Open Tickets</p>
              <p className="mt-4 text-4xl font-semibold text-slate-100">{summary.tickets}</p>
              <p className="mt-2 text-sm text-slate-400">Žádné aktivní požadavky.</p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-800/90 bg-slate-900/95 p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Services</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Manage your services</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-3xl border border-slate-800/90 bg-slate-950 px-4 py-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search services..."
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                />
              </div>
              <button className="rounded-3xl border border-slate-700/90 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                View all
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="rounded-4xl border border-slate-800/90 bg-slate-950/95 p-8 text-center text-slate-400">Načítání služeb...</div>
            ) : filteredVms.length === 0 ? (
              <div className="rounded-4xl border border-slate-800/90 bg-slate-950/95 p-8 text-center text-slate-400">Žádné služby neodpovídají vyhledávání.</div>
            ) : (
              filteredVms.map((vm) => {
                const status = statusLabel(vm.status);
                return (
                  <div key={vm.vmid} className="rounded-4xl border border-slate-800/90 bg-slate-950/95 p-6 shadow-lg">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <Server className="h-4 w-4 text-cyan-300" />
                          <span>VPS ID {vm.vmid}</span>
                        </div>
                        <h3 className="mt-2 text-xl font-semibold text-white">{vm.name}</h3>
                        <p className="mt-2 text-sm text-slate-400">{vm.os} · {vm.ip}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                        <button
                          onClick={() => handleAction(vm.vmid, vm.status?.status === 'running' ? 'stop' : 'start')}
                          className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          {vm.status?.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {vm.status?.status === 'running' ? 'Stop' : 'Start'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                        <p className="text-sm text-slate-400">CPU</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : 'N/A'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                        <p className="text-sm text-slate-400">Memory</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{vm.status ? `${(vm.status.mem / 1024 / 1024).toFixed(1)} GB` : 'N/A'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                        <p className="text-sm text-slate-400">Traffic</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{Math.round(Math.random() * 120)} Mbps</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                        <span>Live CPU usage</span>
                        <span className="text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : '0%'}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${vm.status ? Math.round(vm.status.cpu * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
