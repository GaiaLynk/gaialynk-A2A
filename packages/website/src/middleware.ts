import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { extractLocaleFromPath, resolvePreferredLocale, withLocale } from "@/lib/i18n/paths";

const LOCALE_COOKIE = "gl_locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const localeInPath = extractLocaleFromPath(pathname);
  if (!localeInPath) {
    const preferred = resolvePreferredLocale({
      cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    });
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pathname, preferred);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, localeInPath, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
