import { NextRequest, NextResponse } from "next/server";

// Hafif kimlik doğrulama katmanı.
//
// Davranış:
//  - AUTH_TOKEN ortam değişkeni TANIMLI DEĞİLSE auth devre dışıdır (geliştirme
//    kolaylığı için her şey serbest). Production'da MUTLAKA ayarlanmalıdır.
//  - Tanımlıysa:
//      * Yönetim arayüzü sayfaları: geçerli oturum çerezi yoksa /login'e yönlendirir.
//      * /api/** (auth uçları hariç): cookie VEYA X-API-Key header'ı AUTH_TOKEN ile
//        eşleşmezse 401 döner.
//
// Not: middleware Edge runtime'da çalışır; bu yüzden sadece basit string
// karşılaştırması yapılır (kripto yok).

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
  // Auth devre dışı.
  if (!token) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Her zaman serbest yollar.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const authed = isAuthed(req, token);

  // API uçları: JSON 401.
  if (pathname.startsWith("/api/")) {
    if (authed) return NextResponse.next();
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Geçerli kimlik bilgisi gerekli" },
      { status: 401 },
    );
  }

  // Yönetim arayüzü: login'e yönlendir.
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
