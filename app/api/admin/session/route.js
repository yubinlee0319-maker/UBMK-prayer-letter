import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function GET(request) {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  const authed = Boolean(expected) && cookie === expected;
  return NextResponse.json({ authed });
}
