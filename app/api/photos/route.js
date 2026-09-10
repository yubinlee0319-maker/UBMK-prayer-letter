import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  const MAX_BYTES = 8 * 1024 * 1024; // 8MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "이미지는 8MB 이하만 가능합니다." }, { status: 400 });
  }

  await ensureSchema();
  const db = getDb();
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await db.execute({
    sql: "INSERT INTO photos (filename, mime_type, data) VALUES (?, ?, ?)",
    args: [file.name || "photo", file.type, buffer],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
