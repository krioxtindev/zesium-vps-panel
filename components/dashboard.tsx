'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, LayoutDashboard, LifeBuoy, LineChart as LineChartIcon, Play, RefreshCcw, Server, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { VmRecord, ProxmoxStatus } from '@/lib/types';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface VmDashboardItem extends VmRecord {
  status: ProxmoxStatus | null;
}

const statusLabel = (status: ProxmoxStatus | null) => {
  if (!status) return { text: 'Unknown', color: 'text-slate-300', bg: 'bg-slate-800' };
  if (status.status === 'running') return { text: 'Online', color: 'text-emerald-300', bg: 'bg-emerald-500/10' };
  if (status.status === 'stopped') return { text: 'Offline', color: 'text-slate-300', bg: 'bg-slate-700/80' };
  return { text: 'Unknown', color: 'text-amber-300', bg: 'bg-amber-500/10' };
};

const metrics = [
  { label: 'Online hosts', value: '12', icon: Server, accent: 'text-emerald-300' },
  { label: 'Uptime', value: '99.98%', icon: Activity, accent: 'text-cyan-300' },
  { label: 'Health', value: 'A+', icon: ShieldCheck, accent: 'text-sky-300' },
  { label: 'Traffic', value: '1.3 TB', icon: Upload, accent: 'text-purple-300' },
];

const samplePoints = Array.from({ length: 8 }, (_, index) => ({ x: `-${7 - index}m`, y: Math.round(20 + Math.random() * 65) }));

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
    return vms.filter(
      (vm) =>
        vm.name.toLowerCase().includes(query.toLowerCase()) ||
        String(vm.vmid).includes(query) ||
        vm.ip.includes(query) ||
        vm.os.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, vms]);

  const summary = useMemo(
    () => ({
      total: vms.length,
      online: vms.filter((vm) => vm.status?.status === 'running').length,
      offline: vms.filter((vm) => vm.status?.status === 'stopped').length,
      health: vms.length ? Math.round((vms.filter((vm) => vm.status?.status === 'running').length / vms.length) * 100) : 0,
      traffic: vms.length * 76.4,
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.95fr]">
          <section className="rounded-[40px] border border-slate-800/90 bg-slate-900/95 p-8 shadow-[0_35px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.36em] text-cyan-300/70">Proxmox VPS Control</p>
                <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">Služby, výkon a kontrola v moderním tmavém rozhraní</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                  Postav dashboard pro vaše VPS jako skutečný control center. Všechny servery, uklidněný design a rychlé akce, které šetří čas.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                  <Sparkles className="h-4 w-4" /> Objednat
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-700/90 bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                  <LifeBuoy className="h-4 w-4" /> Support
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-cyan-500/20 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-slate-800">
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="rounded-3xl border border-slate-800/90 bg-slate-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{metric.label}</p>
                        <p className={`mt-4 text-3xl font-semibold ${metric.accent}`}>{metric.value}</p>
                      </div>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800/90 text-slate-100">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Aktuální hosty</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Rychlý přehled všech VPS</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-3xl border border-slate-800/90 bg-slate-950/90 px-4 py-3">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Vyhledat server..."
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                    <LayoutDashboard className="h-4 w-4" /> Všechny
                  </button>
                </div>
              </div>

              {error && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">Chyba: {error}</div>}

              {loading ? (
                <div className="rounded-[32px] border border-slate-800/90 bg-slate-950/90 p-12 text-center text-slate-400">Načítání VPS dat...</div>
              ) : filteredVms.length === 0 ? (
                <div className="rounded-[32px] border border-slate-800/90 bg-slate-950/90 p-12 text-center text-slate-400">Žádné výsledky vyhledávání.</div>
              ) : (
                <div className="grid gap-5">
                  {filteredVms.map((vm) => {
                    const status = statusLabel(vm.status);
                    return (
                      <article key={vm.vmid} className="overflow-hidden rounded-[32px] border border-slate-800/90 bg-slate-950/95 shadow-[0_25px_80px_rgba(0,0,0,0.15)]">
                        <div className="grid gap-4 p-6 md:grid-cols-[1.4fr_0.9fr]">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                                <Server className="h-3.5 w-3.5" /> {vm.name}
                              </span>
                              <span className="text-slate-500">#{vm.vmid}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                              <span>{vm.os}</span>
                              <span>{vm.ip}</span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${status.bg} ${status.color}`}>{status.text}</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">CPU</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : 'N/A'}</p>
                              </div>
                              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">RAM</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{vm.status ? `${(vm.status.mem / 1024 / 1024).toFixed(1)} GB` : 'N/A'}</p>
                              </div>
                              <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Traffic</p>
                                <p className="mt-2 text-2xl font-semibold text-white">{Math.round(Math.random() * 120)} Mbps</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="rounded-3xl border border-slate-800/90 bg-slate-900/95 p-4">
                              <div className="flex items-center justify-between text-sm text-slate-400">
                                <p>CPU historie</p>
                                <p className="text-white">{vm.status ? `${Math.round(vm.status.cpu * 100)}%` : '0%'}</p>
                              </div>
                              <div className="mt-4 h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={samplePoints} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="x" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip
                                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.16)', borderRadius: 12, color: '#e2e8f0' }}
                                    />
                                    <Line type="monotone" dataKey="y" stroke="#38bdf8" strokeWidth={3} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <button
                                onClick={() => handleAction(vm.vmid, vm.status?.status === 'running' ? 'stop' : 'start')}
                                className="rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                              >
                                {vm.status?.status === 'running' ? 'Zastavit' : 'Spustit'}
                              </button>
                              <button className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-700/90 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
                                <Play className="h-4 w-4" /> Detail
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 rounded-[40px] border border-slate-800/90 bg-slate-900/95 p-6 shadow-[0_35px_90px_rgba(0,0,0,0.22)]">
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/95 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Rychlý panel</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Systémové metriky</p>
                </div>
                <div className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">Stabilní</div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <p className="text-sm text-slate-400">Průměrný load</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{summary.online ? `${Math.round((summary.online / Math.max(vms.length, 1)) * 100)}%` : '0%'}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <p className="text-sm text-slate-400">Uptime</p>
                  <p className="mt-2 text-3xl font-semibold text-white">99.98%</p>
                </div>
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <p className="text-sm text-slate-400">Aktivní servery</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{vms.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/95 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Action center</p>
                  <p className="mt-3 text-xl font-semibold text-white">Rychlé operace</p>
                </div>
                <LineChartIcon className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-6 grid gap-3">
                <button className="rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">Restartovat vše</button>
                <button className="rounded-3xl border border-slate-700/90 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Vytvořit snapshot</button>
                <button className="rounded-3xl border border-slate-700/90 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">Povolit firewall</button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/95 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Notifications</p>
                  <p className="mt-3 text-xl font-semibold text-white">Žádné nové upozornění</p>
                </div>
                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">All good</div>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-400">
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <p className="font-semibold text-white">VPN služba: připravena</p>
                  <p className="mt-1">Žádná akce není potřeba.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/95 p-4">
                  <p className="font-semibold text-white">Backup</p>
                  <p className="mt-1">Poslední záloha před 4 hodinami.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
