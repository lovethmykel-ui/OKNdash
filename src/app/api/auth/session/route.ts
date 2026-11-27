import { NextRequest, NextResponse } from 'next/server';
import {
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  buildSessionSetCookieHeader,
  createSessionPayload,
  isTrustedAuthRequest,
  isTrustedFormOrigin,
  resolveSafeRedirectPath,
  signSessionToken,
  validateLoginPayload,
  verifyAnySessionToken,
} from '@/lib/auth/session-token';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tokens = req.cookies.getAll(SESSION_COOKIE_NAME).map((c) => c.value);
  const session = verifyAnySessionToken(tokens);

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

function resolveCookieOptions(req: NextRequest, formFrameContext?: string | null) {
  const frameContext = formFrameContext || req.headers.get('x-frame-context');
  const secFetchSite = req.headers.get('sec-fetch-site');
  const host = (
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host') ||
    ''
  ).toLowerCase();
  const proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    req.nextUrl.protocol.replace(':', '');

  const isIframeOrCrossSite =
    frameContext === 'iframe' ||
    secFetchSite === 'cross-site' ||
    host.endsWith('.run.app');

  if (isIframeOrCrossSite) {
    return { sameSite: 'none' as const, secure: true };
  }

  const isHttps = proto === 'https';
  return { sameSite: 'lax' as const, secure: isHttps };
}

function buildFormErrorRedirect(errorMessage: string, loginPath = '/login') {
  const safeLoginPath = resolveSafeRedirectPath(loginPath, '/login');
  const separator = safeLoginPath.includes('?') ? '&' : '?';
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: `${safeLoginPath}${separator}error=${encodeURIComponent(errorMessage)}`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? '';
  const isFormSubmission =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data');

  if (isFormSubmission) {
    if (!isTrustedFormOrigin(req.headers)) {
      return buildFormErrorRedirect('Unauthorized request origin.');
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return buildFormErrorRedirect('Malformed sign-in submission.');
    }

    const loginPath = resolveSafeRedirectPath(formData.get('loginPath'), '/login');
    const redirectTo = resolveSafeRedirectPath(
      formData.get('redirectTo'),
      '/app/portfolio',
    );
    const frameContextRaw = formData.get('frameContext');
    const frameContext = typeof frameContextRaw === 'string' ? frameContextRaw : null;

    const validation = validateLoginPayload({
      provider: formData.get('provider'),
      acceptedExistingAccountNotice:
        formData.get('acceptedExistingAccountNotice') === 'true',
    });

    if (!validation.ok) {
      return buildFormErrorRedirect(validation.error, loginPath);
    }

    const payload = createSessionPayload(validation.provider);
    const token = signSessionToken(payload);
    const cookieOpts = resolveCookieOptions(req, frameContext);

    const response = new NextResponse(null, {
      status: 303,
      headers: {
        Location: redirectTo,
        'Cache-Control': 'no-store',
      },
    });
    response.headers.append(
      'Set-Cookie',
      buildSessionSetCookieHeader(token, undefined, cookieOpts),
    );
    return response;
  }

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
  const cookieOpts = resolveCookieOptions(req);

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

  response.headers.append(
    'Set-Cookie',
    buildSessionSetCookieHeader(token, undefined, cookieOpts),
  );
  return response;
}

export async function DELETE(req: NextRequest) {
  if (!isTrustedAuthRequest(req.headers)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized request origin.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const cookieOpts = resolveCookieOptions(req);

  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );

  response.headers.append(
    'Set-Cookie',
    buildSessionSetCookieHeader('', 0, cookieOpts, SESSION_COOKIE_NAME),
  );
  response.headers.append(
    'Set-Cookie',
    buildSessionSetCookieHeader('', 0, cookieOpts, LEGACY_SESSION_COOKIE_NAME),
  );
  return response;
}
