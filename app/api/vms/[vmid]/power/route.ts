import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findVm } from '@/lib/mock-db';
import { requireAuth } from '@/lib/auth';
import { controlVm } from '@/lib/proxmox';

const validActions = new Set(['start', 'stop', 'shutdown', 'reset']);

export async function POST(request: NextRequest, { params }: { params: { vmid: string } }) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vmid = Number(params.vmid);
  if (!user.vmids.includes(vmid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vm = findVm(vmid);
  if (!vm) {
    return NextResponse.json({ error: 'VM nenalezena.' }, { status: 404 });
  }

  const body = await request.json();
  const action = String(body.action ?? '').toLowerCase();
  if (!validActions.has(action)) {
    return NextResponse.json({ error: 'Neplatná akce.' }, { status: 400 });
  }

  await controlVm(vm, action as 'start' | 'stop' | 'shutdown' | 'reset');
  return NextResponse.json({ success: true, action });
}
