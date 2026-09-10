import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "ubmk_admin";

/**
 * Returns a 401 NextResponse if the request isn't authenticated as admin,
 * otherwise returns null (meaning: proceed).
 */
export function requireAdmin(request) {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || cookie !== expected) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}
