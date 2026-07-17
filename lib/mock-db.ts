import type { UserRecord, VmRecord } from './types';

const users: Record<string, UserRecord> = {
  alice: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice Novák',
    password: 'password123',
    role: 'client',
    vmids: [101, 102],
  },
  bob: {
    id: 'user-2',
    username: 'bob',
    displayName: 'Bob Svoboda',
    password: 'securepass',
    role: 'client',
    vmids: [103],
  },
  admin: {
    id: 'admin-1',
    username: 'admin',
    displayName: 'Správce',
    password: 'adminpass',
    role: 'admin',
    vmids: [101, 102, 103],
  },
};

const vms: Record<number, VmRecord> = {
  101: { vmid: 101, name: 'web-vps-01', node: 'pve-node1', ip: '10.0.0.11', os: 'Ubuntu 24.04' },
  102: { vmid: 102, name: 'db-vps-02', node: 'pve-node1', ip: '10.0.0.12', os: 'Debian 12' },
  103: { vmid: 103, name: 'app-vps-03', node: 'pve-node2', ip: '10.0.0.21', os: 'CentOS 9' },
};

export function findUserByUsername(username: string) {
  return Object.values(users).find((user) => user.username === username) ?? null;
}

export function findUserById(id: string) {
  return Object.values(users).find((user) => user.id === id) ?? null;
}

export function getUserVmids(userId: string) {
  const user = findUserById(userId);
  return user ? [...user.vmids] : [];
}

export function getVmsForUser(userId: string) {
  const vmids = getUserVmids(userId);
  return vmids.map((vmid) => vms[vmid]).filter(Boolean) as VmRecord[];
}

export function findVm(vmid: number) {
  return vms[vmid] ?? null;
}

export function updateUserVmids(userId: string, vmids: number[]) {
  const user = findUserById(userId);
  if (!user) return false;
  user.vmids = vmids;
  return true;
}

export function updateVmRecord(vmid: number, patch: Partial<VmRecord>) {
  const vm = vms[vmid];
  if (!vm) return false;
  vms[vmid] = { ...vm, ...patch };
  return true;
}

export function getAllUsers() {
  return Object.values(users);
}

export function getAllVms() {
  return Object.values(vms);
}
