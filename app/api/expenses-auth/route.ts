import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

const COOKIE_NAME = 'expenses_dev_session';

function getExpectedPasscode(): string | null {
  const val = process.env.EXPENSES_DEV_PASSCODE?.trim();
  return val ? val : null;
}

function signSessionToken(passcode: string): string {
  return crypto.createHmac('sha256', passcode).update('planfolio-expenses-dev').digest('hex');
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function readCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function GET(req: Request) {
  const expected = getExpectedPasscode();
  if (!expected) {
    return NextResponse.json({ authorized: false, configured: false });
  }

  const token = readCookie(req, COOKIE_NAME);
  if (!token) {
    return NextResponse.json({ authorized: false, configured: true });
  }

  const valid = timingSafeMatch(token, signSessionToken(expected));
  return NextResponse.json({ authorized: valid, configured: true });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = checkRateLimit(`expenses-auth:${ip}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { authorized: false, error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    );
  }

  const expected = getExpectedPasscode();
  if (!expected) {
    return NextResponse.json(
      { authorized: false, error: 'Developer access is not configured on this server.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const submitted = typeof body?.passcode === 'string' ? body.passcode.trim() : '';

    if (!submitted || !timingSafeMatch(submitted, expected)) {
      return NextResponse.json(
        { authorized: false, error: 'Incorrect passcode. Please try again.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ authorized: true });
    res.cookies.set(COOKIE_NAME, signSessionToken(expected), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch {
    return NextResponse.json({ authorized: false, error: 'Invalid request.' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authorized: false });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
