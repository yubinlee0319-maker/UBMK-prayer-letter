import { getDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getNewsletters() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT id, title, subtitle, created_at FROM newsletters ORDER BY created_at DESC, id DESC"
  );
  return result.rows;
}

export default async function HomePage() {
  const newsletters = await getNewsletters();

  return (
    <div className="main-wrapper">
      <div className="glass-container">
        <header>
          <div className="header-content">
            <h1>UBMK 기도 편지</h1>
            <p>지금까지의 소식을 모아봅니다</p>
          </div>
        </header>

        <main>
          {newsletters.length === 0 ? (
            <div className="empty-state">
              <p>아직 등록된 기도편지가 없습니다.</p>
            </div>
          ) : (
            <ul className="issue-list">
              {newsletters.map((n) => (
                <li key={n.id}>
                  <a className="issue-card" href={`/newsletter/${n.id}`}>
                    <h2>{n.title}</h2>
                    {n.subtitle ? <p>{n.subtitle}</p> : null}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>

        <footer>
          <p>&copy; 2026 UBMK. All rights reserved.</p>
          <p style={{ marginTop: 8 }}>
            <a href="/admin" style={{ color: "inherit" }}>
              관리자 페이지
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
