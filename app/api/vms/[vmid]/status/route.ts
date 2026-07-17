import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { findVm, getUserVmids } from '@/lib/mock-db';
import { requireAuth } from '@/lib/auth';
import { getVmStatus } from '@/lib/proxmox';

export async function GET(request: NextRequest, { params }: { params: { vmid: string } }) {
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

  const status = await getVmStatus(vm);
  return NextResponse.json({ vm, status });
}
