import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // For actual API requests, add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

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
  // Match only internationalized pathnames and API routes
  matcher: [
    // Match the root path
    '/',
    // Match locale-prefixed paths only
    '/(fi|en|sv|no|da)/:path*',
    // Match the old non-localized routes to redirect them
    '/(tournaments|teams|matches|venues|profile|results|live)/:path*',
    // Match API routes for CORS handling
    '/api/:path*',
  ],
};
