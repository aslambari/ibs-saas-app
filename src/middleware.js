import { NextResponse } from "next/server";

const LOGIN_PATH = "/login";
const AUTH_API_PREFIX = "/api/auth";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === LOGIN_PATH || pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next();
  }

  // Allow static assets and _next
  if (pathname.startsWith("/_next") || pathname.startsWith("/images") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("auth")?.value;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || authCookie !== sessionSecret) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
