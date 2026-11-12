import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Serve the portfolio dashboard directly at root / without a 307 redirect
  if (pathname === '/' || pathname === '/en' || pathname === '/app' || pathname === '/en/app') {
    req.nextUrl.pathname = '/app/portfolio';
    return intlMiddleware(req);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
