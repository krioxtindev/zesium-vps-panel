import type { VmRecord, ProxmoxStatus } from './types';

const PROXMOX_API_URL = process.env.PROXMOX_API_URL ?? '';
const PROXMOX_API_TOKEN = process.env.PROXMOX_API_TOKEN ?? '';
const ProxmoxConfigured = Boolean(PROXMOX_API_URL && PROXMOX_API_TOKEN);

async function proxmoxRequest<T>(path: string, method = 'GET', body?: Record<string, string>) {
  if (!ProxmoxConfigured) {
    throw new Error('Proxmox API není nakonfigurováno. Nastav PROXMOX_API_URL a PROXMOX_API_TOKEN.');
  }

  const url = `${PROXMOX_API_URL.replace(/\/$/, '')}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `PVEAPIToken=${PROXMOX_API_TOKEN}`,
  };

  let requestBody: URLSearchParams | undefined;
  if (body) {
    requestBody = new URLSearchParams(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody ? requestBody.toString() : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Proxmox API request failed ${response.status}: ${message}`);
  }

  const payload = await response.json();
  return payload.data as T;
}

export async function getVmStatus(vm: VmRecord): Promise<ProxmoxStatus> {
  try {
    const data = await proxmoxRequest<{
      cpu: number;
      mem: number;
      maxmem: number;
      uptime: number;
      status: string;
    }>(`/api2/json/nodes/${vm.node}/qemu/${vm.vmid}/status/current`);

    return {
      cpu: data.cpu,
      mem: data.mem,
      maxmem: data.maxmem,
      uptime: data.uptime,
      status: data.status === 'running' ? 'running' : 'stopped',
    };
  } catch (error) {
    return {
      cpu: 0,
      mem: 0,
      maxmem: 0,
      uptime: 0,
      status: 'unknown',
    };
  }
}

export async function controlVm(vm: VmRecord, action: 'start' | 'stop' | 'shutdown' | 'reset') {
  const path = `/api2/json/nodes/${vm.node}/qemu/${vm.vmid}/status/${action}`;
  return proxmoxRequest<Record<string, unknown>>(path, 'POST');
}

export async function createVncTicket(vm: VmRecord) {
  return proxmoxRequest<{ ticket: string; port: number; host: string }>(
    `/api2/json/nodes/${vm.node}/qemu/${vm.vmid}/vncproxy`,
    'POST'
  );
}

export async function reinstallVm(vm: VmRecord, template: string) {
  if (!ProxmoxConfigured) {
    return {
      message: `Reinstallace do frontendu zaškrtla šablonu ${template}.`,
    };
  }

  await controlVm(vm, 'shutdown');

  return {
    message: `Reinstallace VM ${vm.name} spuštěna pomocí šablony ${template}.`,
  };
}
