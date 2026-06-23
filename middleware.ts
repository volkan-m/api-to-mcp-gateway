import { NextRequest, NextResponse } from "next/server";

// Lightweight authentication layer.
//
// Behavior:
//  - If AUTH_TOKEN env variable is NOT DEFINED, auth is disabled (everything
//    is open for development convenience). MUST be set in production.
//  - If defined:
//      * Management UI pages: redirects to /login if no valid session cookie.
//      * /api/** (except auth endpoints): returns 401 if cookie OR X-API-Key header
//        does not match AUTH_TOKEN.
//
// Note: middleware runs on Edge runtime; only simple string
// comparison is performed (no crypto).

const COOKIE_NAME = "mcp_auth";

function isAuthed(req: NextRequest, token: string): boolean {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie && cookie === token) return true;
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === token) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth.replace(/^Bearer\s+/i, "") === token) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const token = process.env.AUTH_TOKEN;
  // Auth disabled.
  if (!token) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always-open paths.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const authed = isAuthed(req, token);

  // API endpoints: JSON 401.
  if (pathname.startsWith("/api/")) {
    if (authed) return NextResponse.next();
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Geçerli kimlik bilgisi gerekli" },
      { status: 401 },
    );
  }

  // Management UI: redirect to login.
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
