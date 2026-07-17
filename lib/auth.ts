import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { findUserById, findUserByUsername, verifyPassword } from './mock-db';
import type { UserRecord } from './types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'super-secret-change-me';
const JWT_EXPIRES_IN = '1h';

export function signToken(user: UserRecord) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string; username: string };
  } catch {
    return null;
  }
}

export function getToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader.match(/(?:^|; )token=([^;]+)/);
  return match?.[1] ?? null;
}

export function requireAuth(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return null;
  }

  return findUserById(payload.sub);
}

export function requireAdmin(request: NextRequest) {
  const user = requireAuth(request);
  if (!user || user.role !== 'admin') {
    return null;
  }

  return user;
}

export function authenticateUser(username: string, password: string) {
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password)) {
    return null;
  }

  return user;
}
