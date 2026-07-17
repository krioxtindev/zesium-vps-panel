import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateUser, signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');

  const user = authenticateUser(username, password);
  if (!user) {
    return NextResponse.json({ error: 'Neplatné přihlašovací údaje.' }, { status: 401 });
  }

  const token = signToken(user);
  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      vmids: user.vmids,
    },
    token,
  });

  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60,
  });

  return response;
}
