import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check if pathname already has a locale prefix
  const locales = ['fi', 'en', 'sv', 'no', 'da'];
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  
  // If no locale prefix and not root, redirect to default locale
  if (!hasLocale && pathname !== '/') {
    const defaultLocale = 'fi';
    const url = new URL(request.url);
    url.pathname = `/${defaultLocale}${pathname}`;
    // Preserve query string
    const redirectUrl = url.toString();
    console.log(`[Middleware] Redirecting ${pathname} to ${redirectUrl}`);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Let next-intl handle all routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_static`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_static`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_static|.*\\..*).*)'
  ],
};
