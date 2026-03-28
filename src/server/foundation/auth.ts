import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { deleteSession, getSessionViewer } from './repository';
import type { AuthViewer } from './types';

export const SESSION_COOKIE_NAME = 'echolens_session';

export async function getViewerFromRequest(): Promise<AuthViewer | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionViewer(sessionId);
}

export async function requireViewer(): Promise<AuthViewer> {
  const viewer = await getViewerFromRequest();
  if (!viewer) {
    throw new Error('UNAUTHENTICATED');
  }
  return viewer;
}

export async function setSessionCookie(response: NextResponse, sessionId: string): Promise<void> {
  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(response: NextResponse): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  deleteSession(sessionId);
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...valueParts] = part.trim().split('=');
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(valueParts.join('='));
    return acc;
  }, {});
}
