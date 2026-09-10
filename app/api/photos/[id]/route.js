import { getDb, ensureSchema } from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  await ensureSchema();
  const db = getDb();

  const result = await db.execute({
    sql: "SELECT mime_type, data FROM photos WHERE id = ?",
    args: [id],
  });
  const photo = result.rows[0];
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const bytes =
    photo.data instanceof ArrayBuffer ? new Uint8Array(photo.data) : photo.data;

  return new Response(bytes, {
    headers: {
      "Content-Type": photo.mime_type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
