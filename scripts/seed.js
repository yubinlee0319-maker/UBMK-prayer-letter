// One-time seed: imports the original March issue (previously hardcoded in
// index.html / newsletter.html) into Turso, including its 4 photos.
// Run with: npm run seed

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 환경변수가 필요합니다.");
    process.exit(1);
  }

  const db = createClient({ url, authToken });

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

  const existing = await db.execute("SELECT COUNT(*) as c FROM newsletters");
  if (Number(existing.rows[0].c) > 0) {
    console.log("이미 데이터가 있어 seed를 건너뜁니다.");
    return;
  }

  const publicDir = path.join(__dirname, "..", "public");
  async function insertPhoto(filename) {
    const filePath = path.join(publicDir, filename);
    const data = fs.readFileSync(filePath);
    const result = await db.execute({
      sql: "INSERT INTO photos (filename, mime_type, data) VALUES (?, ?, ?)",
      args: [filename, "image/jpeg", data],
    });
    return Number(result.lastInsertRowid);
  }

  const photoIds = {
    "01.jpg": await insertPhoto("01.jpg"),
    "02.jpg": await insertPhoto("02.jpg"),
    "03.jpg": await insertPhoto("03.jpg"),
    "04.jpg": await insertPhoto("04.jpg"),
  };

  const newsletterResult = await db.execute({
    sql: "INSERT INTO newsletters (title, subtitle) VALUES (?, ?)",
    args: ["UBMK 기도 편지 - 3월호", "2026년 3월의 소식을 전합니다"],
  });
  const newsletterId = Number(newsletterResult.lastInsertRowid);

  const sections = [
    {
      badgeLabel: "Issue 01",
      badgeColor: "#3b82f6",
      title: "입학식 & 새친구 & 웰컴데이",
      body: "샬롬!! 3.2일 입학식을 했습니다. 아들 정인이는 한국에서 교육선교사로 오신 분이 담임선생님이 되었습니다. 입학식 이후에 저희 학교 유치원에 4살 도하가 왔습니다. 한 주 정도 엄마와 헤어질 때 한참을 울던 도하가 체육물품도 보내주고 같이 놀아 주면서 적응을 도왔는데 한 주 후 잘 지내는 모습에 감사했습니다. 또 4살 이쁜 지온이도 왔습니다. 3.12일에는 신입생, 신입교육선교사들을 위한 웰컴데이를 통해 마음껏 축복했습니다.",
      photoId: photoIds["01.jpg"],
    },
    {
      badgeLabel: "Issue 02",
      badgeColor: "#10b981",
      title: "초등역사교실 & 방과후 축구와 태권도",
      body: "전선교사는 작년에 국가기관에 신청한 역사체험교실이 당첨이 되어 초등역사체험교실을 열었습니다. 강선교사는 올해도 태권도 동아리를 열었는데 초등18명 중 9명이 신청을 하여 놀람으로 시작했고 방과후 축구는 4명이 신청하였습니다. 선교지학교에서는 다양한 수업에 대한 체험이 많지 않아 안타까운 현실인데 이들에게 작은 도움이라도 되면 좋겠습니다.",
      photoId: photoIds["02.jpg"],
    },
    {
      badgeLabel: "Issue 03",
      badgeColor: "#f59e0b",
      title: "3월 성품 순종 & 신앙수련회",
      body: "저희 학교의 교훈은 '순종과 배려'입니다. 하나님을 사랑함은 그의 계명을 지키는 순종으로 나타나고, 이웃사랑은 배려로 나타내도록 교육하는 학교입니다. 3월 첫 수요채플 성품설교는 '깊은 데로 가서 그물을 내려 고기를 잡으라'는 주님이 말씀에 순종하여 빈 배가 두 배를 채우고 잠기게 되는 풍성한 은혜를 전했습니다. 초등신앙수련회는 '거룩한 백성, 거룩한 삶'(레11:45) 이란 주제로 우리의 정체성과 사명을 일깨우는 시간을 가졌습니다.",
      photoId: photoIds["03.jpg"],
    },
    {
      badgeLabel: "Issue 04",
      badgeColor: "#8b5cf6",
      title: "임원선거 & 학부모모임 & 고난주간",
      body: "학생회 임원선거가 있었습니다. 자유민주주의의 꽃인 투표를 배우는 소중한 시간이었습니다. 학부모모임은 교장선생님께서 올해 신규교육선교사들을 소개하고 학교의 방향을 말씀하신 후 각 과정모임을 통해 의견을 청취하는 시간을 가졌습니다. 올해 고난주간은 '너를 살리고자 내가 죽었음이라'는 말씀이 다가왔습니다. 내가 살고자 남을 밟는 세상의 풍조에 역행하는 제자로 살아가길 소망합니다.",
      photoId: photoIds["04.jpg"],
    },
  ];

  const prayerItems = [
    "믿음의 동료들이 연합하는 아름다움 속에 영생을 누리게 하시니 감사합니다.",
    "딸이 한국에서 대학생활을 잘 적응하고 필요를 채워주시니 감사합니다.",
    "저희 부부가 건강관리, 체력관리를 잘하므로 4월 교육선교를 잘 감당케 하소서.",
    "고2 아들의 유럽비전트립(10월 중. RE-ENTRY 과정)을 위한 항공권 및 여비가 잘 채워지게 하소서.",
    "하나님을 향한 신뢰와 순종, 기도의 무릎이 약해지지 않게 하소서.",
  ];

  const statements = sections.map((s, i) => ({
    sql: "INSERT INTO sections (newsletter_id, order_index, badge_label, badge_color, title, body, photo_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [newsletterId, i, s.badgeLabel, s.badgeColor, s.title, s.body, s.photoId],
  }));

  prayerItems.forEach((text, i) => {
    statements.push({
      sql: "INSERT INTO prayer_items (newsletter_id, order_index, text) VALUES (?, ?, ?)",
      args: [newsletterId, i, text],
    });
  });

  await db.batch(statements, "write");

  console.log(`Seed 완료: newsletter id = ${newsletterId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
