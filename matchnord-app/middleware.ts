import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_static`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_static|.*\\..*).*)'
  ],
};
