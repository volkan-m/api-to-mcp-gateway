import { NextResponse } from "next/server";

// POST /api/auth/logout -> oturum çerezini temizle.
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("mcp_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
