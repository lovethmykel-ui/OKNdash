import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  SESSION_COOKIE_NAME,
  hasAnyPlausibleSessionCookie,
} from './lib/auth/session-cookie-check';

const intlMiddleware = createIntlMiddleware(routing);

function stripLocalePrefix(pathname: string): {
  localePrefix: string;
  normalizedPath: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && (routing.locales as readonly string[]).includes(first)) {
    const rest = `/${segments.slice(1).join('/')}`;
    return {
      localePrefix: first === routing.defaultLocale ? '' : `/${first}`,
      normalizedPath: rest === '/' ? '/' : rest,
    };
  }
  return {
    localePrefix: '',
    normalizedPath: pathname || '/',
  };
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { localePrefix, normalizedPath } = stripLocalePrefix(pathname);
  const sessionTokens = req.cookies.getAll(SESSION_COOKIE_NAME).map((c) => c.value);
  const hasSession = hasAnyPlausibleSessionCookie(sessionTokens);

  const isRoot = normalizedPath === '/';
  const isAppRoot = normalizedPath === '/app';
  const isProtectedApp = isAppRoot || normalizedPath.startsWith('/app/');

  // Unauthenticated visitors attempting to open root or any /app/* route go to /login
  if ((isRoot || isProtectedApp) && !hasSession) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = `${localePrefix}/login`;
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated visitors landing on / or /app go straight to the portfolio dashboard
  if ((isRoot || isAppRoot) && hasSession) {
    req.nextUrl.pathname = `${localePrefix}/app/portfolio`;
    return intlMiddleware(req);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
