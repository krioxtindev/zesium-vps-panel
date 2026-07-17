import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import type { UserRecord, VmRecord } from './types';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  displayName TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  vmids TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS vms (
  vmid INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  node TEXT NOT NULL,
  ip TEXT NOT NULL,
  os TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, displayName, password, role, vmids) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertUser.run('user-1', 'alice', 'Alice Novák', hashPassword('password123'), 'client', JSON.stringify([101, 102]));
  insertUser.run('user-2', 'bob', 'Bob Svoboda', hashPassword('securepass'), 'client', JSON.stringify([103]));
  insertUser.run('admin-1', 'admin', 'Správce', hashPassword('adminpass'), 'admin', JSON.stringify([101, 102, 103]));
}

const vmCount = db.prepare('SELECT COUNT(*) AS count FROM vms').get();
if (vmCount.count === 0) {
  const insertVm = db.prepare('INSERT INTO vms (vmid, name, node, ip, os) VALUES (?, ?, ?, ?, ?)');
  insertVm.run(101, 'web-vps-01', 'pve-node1', '10.0.0.11', 'Ubuntu 24.04');
  insertVm.run(102, 'db-vps-02', 'pve-node1', '10.0.0.12', 'Debian 12');
  insertVm.run(103, 'app-vps-03', 'pve-node2', '10.0.0.21', 'CentOS 9');
}

const serializeVmids = (vmids: number[]) => JSON.stringify(vmids);
const parseVmids = (value: string) => {
  try {
    return JSON.parse(value) as number[];
  } catch {
    return [];
  }
};

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

const mapUser = (row: any): UserRecord | null => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    password: row.password,
    role: row.role,
    vmids: parseVmids(row.vmids),
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
  return mapUser(db.prepare('SELECT * FROM users WHERE username = ?').get(username));
}

export function findUserById(id: string) {
  return mapUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
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
  const placeholders = vmids.map(() => '?').join(',');
  const rows = db.prepare(`SELECT * FROM vms WHERE vmid IN (${placeholders})`).all(...vmids);
  return rows.map(mapVm).filter(Boolean) as VmRecord[];
}

export function findVm(vmid: number) {
  return mapVm(db.prepare('SELECT * FROM vms WHERE vmid = ?').get(vmid));
}

export function updateUserVmids(userId: string, vmids: number[]) {
  const user = findUserById(userId);
  if (!user) return false;
  db.prepare('UPDATE users SET vmids = ? WHERE id = ?').run(serializeVmids(vmids), userId);
  return true;
}

export function updateVmRecord(vmid: number, patch: Partial<VmRecord>) {
  const vm = findVm(vmid);
  if (!vm) return false;
  const updates: string[] = [];
  const values: any[] = [];
  if (typeof patch.name === 'string') {
    updates.push('name = ?');
    values.push(patch.name);
  }
  if (typeof patch.node === 'string') {
    updates.push('node = ?');
    values.push(patch.node);
  }
  if (typeof patch.ip === 'string') {
    updates.push('ip = ?');
    values.push(patch.ip);
  }
  if (typeof patch.os === 'string') {
    updates.push('os = ?');
    values.push(patch.os);
  }
  if (updates.length === 0) {
    return false;
  }
  values.push(vmid);
  db.prepare(`UPDATE vms SET ${updates.join(', ')} WHERE vmid = ?`).run(...values);
  return true;
}

export function getAllUsers() {
  return db.prepare('SELECT * FROM users').all().map(mapUser).filter(Boolean) as UserRecord[];
}

export function getAllVms() {
  return db.prepare('SELECT * FROM vms').all().map(mapVm).filter(Boolean) as VmRecord[];
}

export function createUser(user: {
  username: string;
  displayName: string;
  password: string;
  role: UserRecord['role'];
  vmids?: number[];
}) {
  const id = `user-${Date.now()}`;
  try {
    db.prepare(
      'INSERT INTO users (id, username, displayName, password, role, vmids) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, user.username, user.displayName, hashPassword(user.password), user.role, serializeVmids(user.vmids ?? []));
    return findUserById(id);
  } catch {
    return null;
  }
}

export function createVm(vm: VmRecord) {
  if (findVm(vm.vmid)) {
    return false;
  }
  db.prepare('INSERT INTO vms (vmid, name, node, ip, os) VALUES (?, ?, ?, ?, ?)').run(
    vm.vmid,
    vm.name,
    vm.node,
    vm.ip,
    vm.os
  );
  return true;
}

export function getConfigValue(key: string) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row?.value ?? null;
}

export function setConfigValue(key: string, value: string) {
  db.prepare(
    'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value);
  return true;
}