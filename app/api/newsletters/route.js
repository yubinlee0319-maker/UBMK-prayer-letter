import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT id, title, subtitle, created_at FROM newsletters ORDER BY created_at DESC, id DESC"
  );
  return NextResponse.json({ newsletters: result.rows });
}

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { title, subtitle, sections, prayerItems } = body;

  if (!title || !Array.isArray(sections) || sections.length === 0) {
    return NextResponse.json(
      { error: "제목과 최소 1개의 섹션이 필요합니다." },
      { status: 400 }
    );
  }

  await ensureSchema();
  const db = getDb();

  const newsletterResult = await db.execute({
    sql: "INSERT INTO newsletters (title, subtitle) VALUES (?, ?)",
    args: [title, subtitle || null],
  });
  const newsletterId = Number(newsletterResult.lastInsertRowid);

  const statements = sections.map((s, i) => ({
    sql: "INSERT INTO sections (newsletter_id, order_index, badge_label, badge_color, title, body, photo_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [
      newsletterId,
      i,
      s.badgeLabel || null,
      s.badgeColor || null,
      s.title || "",
      s.body || "",
      s.photoId || null,
    ],
  }));

  (prayerItems || []).forEach((p, i) => {
    if (p && p.trim()) {
      statements.push({
        sql: "INSERT INTO prayer_items (newsletter_id, order_index, text) VALUES (?, ?, ?)",
        args: [newsletterId, i, p],
      });
    }
  });

  if (statements.length > 0) {
    await db.batch(statements, "write");
  }

  return NextResponse.json({ id: newsletterId });
}
