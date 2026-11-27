import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  buildSessionSetCookieHeader,
  createSessionPayload,
  isTrustedAuthRequest,
  signSessionToken,
  validateLoginPayload,
  verifySessionToken,
} from '@/lib/auth/session-token';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  return NextResponse.json(
    {
      authenticated: Boolean(session),
      session: session
        ? {
            sub: session.sub,
            provider: session.provider,
            telegramId: session.telegramId,
            walletAddress: session.walletAddress,
            adminRole: session.adminRole,
          }
        : null,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

export async function POST(req: NextRequest) {
  if (!isTrustedAuthRequest(req.headers)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized request origin.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Malformed JSON request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const validation = validateLoginPayload(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const payload = createSessionPayload(validation.provider);
  const token = signSessionToken(payload);

  const response = NextResponse.json(
    {
      ok: true,
      provider: validation.provider,
      sub: payload.sub,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );

  response.headers.append('Set-Cookie', buildSessionSetCookieHeader(token));
  return response;
}

export async function DELETE(req: NextRequest) {
  if (!isTrustedAuthRequest(req.headers)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized request origin.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );

  response.headers.append('Set-Cookie', buildSessionSetCookieHeader('', 0));
  return response;
}
