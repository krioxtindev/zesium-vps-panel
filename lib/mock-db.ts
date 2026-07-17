import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { UserRecord, VmRecord } from './types';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.json');

interface DatabaseShape {
  users: UserRecord[];
  vms: VmRecord[];
  config: Record<string, string>;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

const defaultData: DatabaseShape = {
  users: [
    {
      id: 'user-1',
      username: 'alice',
      displayName: 'Alice Novák',
      password: hashPassword('password123'),
      role: 'client',
      vmids: [101, 102],
    },
    {
      id: 'user-2',
      username: 'bob',
      displayName: 'Bob Svoboda',
      password: hashPassword('securepass'),
      role: 'client',
      vmids: [103],
    },
    {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Správce',
      password: hashPassword('adminpass'),
      role: 'admin',
      vmids: [101, 102, 103],
    },
  ],
  vms: [
    { vmid: 101, name: 'web-vps-01', node: 'pve-node1', ip: '10.0.0.11', os: 'Ubuntu 24.04' },
    { vmid: 102, name: 'db-vps-02', node: 'pve-node1', ip: '10.0.0.12', os: 'Debian 12' },
    { vmid: 103, name: 'app-vps-03', node: 'pve-node2', ip: '10.0.0.21', os: 'CentOS 9' },
  ],
  config: {},
};

let db: DatabaseShape;

function loadDatabase(): DatabaseShape {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseShape;
    return {
      users: parsed.users ?? [],
      vms: parsed.vms ?? [],
      config: parsed.config ?? {},
    };
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

function saveDatabase() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

db = loadDatabase();

const mapUser = (row: any): UserRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    password: row.password,
    role: row.role,
    vmids: Array.isArray(row.vmids) ? row.vmids : [],
  };
};

const mapVm = (row: any): VmRecord | null => {
  if (!row) return null;
  return {
    vmid: row.vmid,
    name: row.name,
    node: row.node,
    ip: row.ip,
    os: row.os,
  };
};

export function findUserByUsername(username: string) {
  return mapUser(db.users.find((user) => user.username === username));
}

export function findUserById(id: string) {
  return mapUser(db.users.find((user) => user.id === id));
}

export function getUserVmids(userId: string) {
  const user = findUserById(userId);
  return user ? [...user.vmids] : [];
}

export function getVmsForUser(userId: string) {
  const vmids = getUserVmids(userId);
  if (vmids.length === 0) {
    return [];
  }
  return db.vms.filter((vm) => vmids.includes(vm.vmid)).map(mapVm).filter(Boolean) as VmRecord[];
}

export function findVm(vmid: number) {
  return mapVm(db.vms.find((vm) => vm.vmid === vmid));
}

export function updateUserVmids(userId: string, vmids: number[]) {
  const user = db.users.find((item) => item.id === userId);
  if (!user) return false;
  user.vmids = Array.from(new Set(vmids.filter((id) => Number.isFinite(id))));
  saveDatabase();
  return true;
}

export function updateVmRecord(vmid: number, patch: Partial<VmRecord>) {
  const vm = db.vms.find((item) => item.vmid === vmid);
  if (!vm) return false;
  if (typeof patch.name === 'string') vm.name = patch.name;
  if (typeof patch.node === 'string') vm.node = patch.node;
  if (typeof patch.ip === 'string') vm.ip = patch.ip;
  if (typeof patch.os === 'string') vm.os = patch.os;
  saveDatabase();
  return true;
}

export function getAllUsers() {
  return db.users.map(mapUser).filter(Boolean) as UserRecord[];
}

export function getAllVms() {
  return db.vms.map(mapVm).filter(Boolean) as VmRecord[];
}

export function createUser(user: {
  username: string;
  displayName: string;
  password: string;
  role: UserRecord['role'];
  vmids?: number[];
}) {
  if (db.users.some((item) => item.username === user.username)) {
    return null;
  }

  const id = `user-${Date.now()}`;
  const newUser: UserRecord = {
    id,
    username: user.username,
    displayName: user.displayName,
    password: hashPassword(user.password),
    role: user.role,
    vmids: user.vmids ?? [],
  };
  db.users.push(newUser);
  saveDatabase();
  return mapUser(newUser);
}

export function createVm(vm: VmRecord) {
  if (db.vms.some((item) => item.vmid === vm.vmid)) {
    return false;
  }
  db.vms.push({ ...vm });
  saveDatabase();
  return true;
}

export function getConfigValue(key: string) {
  return db.config[key] ?? null;
}

export function setConfigValue(key: string, value: string) {
  db.config[key] = value;
  saveDatabase();
  return true;
}
