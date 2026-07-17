import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getConfigValue, setConfigValue } from '@/lib/mock-db';

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    proxmoxApiUrl: getConfigValue('proxmox_api_url') ?? '',
    proxmoxApiToken: getConfigValue('proxmox_api_token') ?? '',
  });
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const proxmoxApiUrl = String(body.proxmoxApiUrl ?? '').trim();
  const proxmoxApiToken = String(body.proxmoxApiToken ?? '').trim();

  if (!proxmoxApiUrl || !proxmoxApiToken) {
    return NextResponse.json({ error: 'Neplatná konfigurace Proxmox API.' }, { status: 400 });
  }

  setConfigValue('proxmox_api_url', proxmoxApiUrl);
  setConfigValue('proxmox_api_token', proxmoxApiToken);

  return NextResponse.json({ success: true });
}