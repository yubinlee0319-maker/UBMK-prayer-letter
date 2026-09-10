import { notFound } from "next/navigation";
import { getDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getNewsletter(id) {
  await ensureSchema();
  const db = getDb();

  const newsletterResult = await db.execute({
    sql: "SELECT id, title, subtitle FROM newsletters WHERE id = ?",
    args: [id],
  });
  const newsletter = newsletterResult.rows[0];
  if (!newsletter) return null;

  const sectionsResult = await db.execute({
    sql: "SELECT id, order_index, badge_label, badge_color, title, body, photo_id FROM sections WHERE newsletter_id = ? ORDER BY order_index ASC, id ASC",
    args: [id],
  });

  const prayerResult = await db.execute({
    sql: "SELECT id, text FROM prayer_items WHERE newsletter_id = ? ORDER BY order_index ASC, id ASC",
    args: [id],
  });

  return {
    newsletter,
    sections: sectionsResult.rows,
    prayerItems: prayerResult.rows,
  };
}

export default async function NewsletterPage({ params }) {
  const { id } = await params;
  const data = await getNewsletter(id);
  if (!data) notFound();

  const { newsletter, sections, prayerItems } = data;

  return (
    <div className="main-wrapper">
      <div className="glass-container">
        <header>
          <div className="header-content">
            <h1>UBMK 기도 편지</h1>
            <p>{newsletter.subtitle || newsletter.title}</p>
          </div>
        </header>

        <main>
          {sections.map((s, i) => (
            <div className={`section${i % 2 === 1 ? " reverse" : ""}`} key={s.id}>
              {i % 2 === 1 ? (
                <>
                  <div className="text-content" style={{ textAlign: "right" }}>
                    <span
                      className="number-badge"
                      style={s.badge_color ? { background: s.badge_color } : undefined}
                    >
                      {s.badge_label || `Issue ${String(i + 1).padStart(2, "0")}`}
                    </span>
                    <h2 className="section-title">{s.title}</h2>
                    <p className="section-text" style={{ textAlign: "right" }}>
                      {s.body}
                    </p>
                  </div>
                  <div className="image-container">
                    {s.photo_id ? (
                      <img src={`/api/photos/${s.photo_id}`} alt={s.title} />
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="image-container">
                    {s.photo_id ? (
                      <img src={`/api/photos/${s.photo_id}`} alt={s.title} />
                    ) : null}
                  </div>
                  <div className="text-content">
                    <span
                      className="number-badge"
                      style={s.badge_color ? { background: s.badge_color } : undefined}
                    >
                      {s.badge_label || `Issue ${String(i + 1).padStart(2, "0")}`}
                    </span>
                    <h2 className="section-title">{s.title}</h2>
                    <p className="section-text">{s.body}</p>
                  </div>
                </>
              )}
            </div>
          ))}

          {prayerItems.length > 0 && (
            <div className="prayer-card">
              <h2 className="prayer-title">감사 &amp; 기도제목</h2>
              <div className="prayer-list">
                {prayerItems.map((p, i) => (
                  <div className="prayer-item" key={p.id}>
                    <div className="prayer-number">{i + 1}</div>
                    <div className="prayer-text">{p.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer>
          <p>&copy; 2026 UBMK. All rights reserved.</p>
          <p style={{ marginTop: 8 }}>
            <a href="/" style={{ color: "inherit" }}>
              전체 목록으로
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
