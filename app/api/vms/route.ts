import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getVmsForUser } from '@/lib/mock-db';
import { getVmStatus } from '@/lib/proxmox';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vms = getVmsForUser(user.id).map((vm) => ({
    ...vm,
    status: null,
  }));

  const statusPayload = await Promise.all(
    vms.map(async (vm) => {
      const status = await getVmStatus(vm);
      return { vmid: vm.vmid, status };
    })
  );

  const vmsWithStatus = vms.map((vm) => {
    const status = statusPayload.find((item) => item.vmid === vm.vmid)?.status ?? null;
    return { ...vm, status };
  });

  return NextResponse.json({ vms: vmsWithStatus });
}