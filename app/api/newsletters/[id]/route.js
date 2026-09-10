import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(request, { params }) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await ensureSchema();
  const db = getDb();
  await db.batch(
    [
      { sql: "DELETE FROM sections WHERE newsletter_id = ?", args: [id] },
      { sql: "DELETE FROM prayer_items WHERE newsletter_id = ?", args: [id] },
      { sql: "DELETE FROM newsletters WHERE id = ?", args: [id] },
    ],
    "write"
  );
  return NextResponse.json({ ok: true });
}
