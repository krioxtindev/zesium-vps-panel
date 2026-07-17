import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createUser, getAllUsers, getAllVms, updateUserVmids, updateVmRecord } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ users: getAllUsers(), vms: getAllVms() });
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const username = String(body.username ?? '').trim();
  const displayName = String(body.displayName ?? '').trim();
  const password = String(body.password ?? '');
  const role = body.role === 'admin' ? 'admin' : 'client';

  if (!username || !displayName || !password) {
    return NextResponse.json({ error: 'Neplatná data pro vytvoření uživatele.' }, { status: 400 });
  }

  const created = createUser({ username, displayName, password, role, vmids: [] });
  if (!created) {
    return NextResponse.json({ error: 'Uživatel již existuje nebo nelze vytvořit.' }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: created });
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const userId = String(body.userId ?? '');
  const vmids = Array.isArray(body.vmids) ? body.vmids.map(Number) : [];
  const updated = updateUserVmids(userId, vmids);

  if (!updated) {
    return NextResponse.json({ error: 'Neplatné ID uživatele.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const vmid = Number(body.vmid);
  const patch = body.patch ?? {};
  const updated = updateVmRecord(vmid, patch);

  if (!updated) {
    return NextResponse.json({ error: 'Neplatné VM ID.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}