import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });

// POST /api/auth/login -> şifre doğruysa oturum çerezi ayarla.
export async function POST(req: NextRequest) {
  const token = process.env.AUTH_TOKEN;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Auth devre dışıysa login'e gerek yok.
  if (!token || !adminPassword) {
    return NextResponse.json(
      { error: "AUTH_DISABLED", message: "Kimlik doğrulama yapılandırılmamış" },
      { status: 400 },
    );
  }

  let body: { password: string };
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Şifre gerekli" },
      { status: 400 },
    );
  }

  if (body.password !== adminPassword) {
    return NextResponse.json(
      { error: "INVALID_CREDENTIALS", message: "Hatalı şifre" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("mcp_auth", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
  });
  return res;
}
