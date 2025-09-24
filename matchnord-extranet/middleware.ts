import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle non-localized routes that should return 404
  const nonLocalizedRoutes = [
    '/tournaments',
    '/teams',
    '/matches',
    '/venues',
    '/profile',
    '/results',
    '/live',
  ];
  if (nonLocalizedRoutes.includes(pathname)) {
    // Redirect to the localized version
    return NextResponse.redirect(new URL(`/fi${pathname}`, request.url));
  }

  // Handle all other requests with next-intl middleware
  return handleI18nRouting(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match the root path
    '/',
    // Match locale-prefixed paths only
    '/(fi|en|sv|no|da)/:path*',
    // Match the old non-localized routes to redirect them
    '/(tournaments|teams|matches|venues|profile|results|live)/:path*',
  ],
};
