import { createClient } from "@libsql/client";

let client;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

// Creates all tables if they don't exist yet. Safe to call on every request.
export async function ensureSchema() {
  const db = getDb();
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data BLOB NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS newsletters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        newsletter_id INTEGER NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        badge_label TEXT,
        badge_color TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        photo_id INTEGER REFERENCES photos(id)
      )`,
      `CREATE TABLE IF NOT EXISTS prayer_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        newsletter_id INTEGER NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL DEFAULT 0,
        text TEXT NOT NULL
      )`,
    ],
    "write"
  );
}
