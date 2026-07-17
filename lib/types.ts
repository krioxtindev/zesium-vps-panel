export type UserRole = 'admin' | 'client';

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  vmids: number[];
}

export interface VmRecord {
  vmid: number;
  name: string;
  node: string;
  ip: string;
  os: string;
  status?: 'running' | 'stopped' | 'unknown' | 'suspended';
}

export interface ProxmoxStatus {
  cpu: number;
  mem: number;
  maxmem: number;
  uptime: number;
  status: 'running' | 'stopped' | 'unknown';
}
