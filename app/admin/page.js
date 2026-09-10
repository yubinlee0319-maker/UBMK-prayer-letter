"use client";

import { useEffect, useState } from "react";

const BADGE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

function emptySection(i) {
  return {
    badgeLabel: `Issue ${String(i + 1).padStart(2, "0")}`,
    badgeColor: BADGE_COLORS[i % BADGE_COLORS.length],
    title: "",
    body: "",
    file: null,
  };
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [newsletters, setNewsletters] = useState([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sections, setSections] = useState([emptySection(0)]);
  const [prayerItems, setPrayerItems] = useState([""]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text }

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(Boolean(d.authed));
        setChecking(false);
        if (d.authed) loadNewsletters();
      })
      .catch(() => setChecking(false));
  }, []);

  async function loadNewsletters() {
    const res = await fetch("/api/newsletters");
    const data = await res.json();
    setNewsletters(data.newsletters || []);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      loadNewsletters();
    } else {
      const d = await res.json().catch(() => ({}));
      setLoginError(d.error || "로그인에 실패했습니다.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setPassword("");
  }

  function updateSection(index, patch) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }

  function addSection() {
    setSections((prev) => [...prev, emptySection(prev.length)]);
  }

  function removeSection(index) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePrayerItem(index, value) {
    setPrayerItems((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addPrayerItem() {
    setPrayerItems((prev) => [...prev, ""]);
  }

  function removePrayerItem(index) {
    setPrayerItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPhoto(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "사진 업로드에 실패했습니다.");
    }
    const d = await res.json();
    return d.id;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!title.trim()) {
      setStatus({ type: "error", text: "제목을 입력해주세요." });
      return;
    }
    if (sections.some((s) => !s.title.trim() || !s.body.trim())) {
      setStatus({ type: "error", text: "모든 섹션에 제목과 내용을 입력해주세요." });
      return;
    }

    setSaving(true);
    try {
      const preparedSections = [];
      for (const s of sections) {
        let photoId = null;
        if (s.file) {
          photoId = await uploadPhoto(s.file);
        }
        preparedSections.push({
          badgeLabel: s.badgeLabel,
          badgeColor: s.badgeColor,
          title: s.title,
          body: s.body,
          photoId,
        });
      }

      const res = await fetch("/api/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          sections: preparedSections,
          prayerItems: prayerItems.filter((p) => p.trim()),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "저장에 실패했습니다.");
      }

      setStatus({ type: "success", text: "기도편지가 등록되었습니다." });
      setTitle("");
      setSubtitle("");
      setSections([emptySection(0)]);
      setPrayerItems([""]);
      loadNewsletters();
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("이 기도편지를 삭제할까요?")) return;
    const res = await fetch(`/api/newsletters/${id}`, { method: "DELETE" });
    if (res.ok) loadNewsletters();
  }

  if (checking) {
    return <div className="admin-wrapper">확인 중...</div>;
  }

  if (!authed) {
    return (
      <div className="admin-wrapper">
        <div className="admin-card">
          <h1 style={{ marginBottom: 20 }}>관리자 로그인</h1>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <p className="status-msg error">{loginError}</p>}
            <button className="btn" type="submit">
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <h1>기도편지 관리</h1>
        <div className="btn-row">
          <a className="btn secondary" href="/">
            사이트 보기
          </a>
          <button className="btn secondary" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h2 style={{ marginBottom: 16 }}>새 기도편지 등록</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>제목 (예: UBMK 기도 편지 - 4월호)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>부제 (예: 2026년 4월의 소식을 전합니다)</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>

          <h3 style={{ margin: "20px 0 10px" }}>섹션</h3>
          {sections.map((s, i) => (
            <div className="section-block" key={i}>
              <div className="field">
                <label>배지 라벨</label>
                <input
                  type="text"
                  value={s.badgeLabel}
                  onChange={(e) => updateSection(i, { badgeLabel: e.target.value })}
                />
              </div>
              <div className="field">
                <label>소제목</label>
                <input
                  type="text"
                  value={s.title}
                  onChange={(e) => updateSection(i, { title: e.target.value })}
                />
              </div>
              <div className="field">
                <label>내용</label>
                <textarea
                  value={s.body}
                  onChange={(e) => updateSection(i, { body: e.target.value })}
                />
              </div>
              <div className="field">
                <label>사진</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateSection(i, { file: e.target.files?.[0] || null })}
                />
              </div>
              {sections.length > 1 && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => removeSection(i)}
                >
                  이 섹션 삭제
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn secondary" onClick={addSection}>
            + 섹션 추가
          </button>

          <h3 style={{ margin: "24px 0 10px" }}>감사 &amp; 기도제목</h3>
          {prayerItems.map((p, i) => (
            <div className="field" key={i} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={p}
                onChange={(e) => updatePrayerItem(i, e.target.value)}
                style={{ flex: 1 }}
              />
              {prayerItems.length > 1 && (
                <button type="button" className="btn danger" onClick={() => removePrayerItem(i)}>
                  삭제
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn secondary" onClick={addPrayerItem}>
            + 기도제목 추가
          </button>

          <div style={{ marginTop: 24 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "저장 중..." : "기도편지 등록"}
            </button>
          </div>
          {status && (
            <p className={`status-msg ${status.type}`}>{status.text}</p>
          )}
        </form>
      </div>

      <div className="admin-card">
        <h2 style={{ marginBottom: 16 }}>등록된 기도편지</h2>
        {newsletters.length === 0 ? (
          <p className="hint">아직 등록된 기도편지가 없습니다.</p>
        ) : (
          <ul className="issue-list">
            {newsletters.map((n) => (
              <li key={n.id} className="issue-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.05rem" }}>{n.title}</h2>
                  {n.subtitle && <p>{n.subtitle}</p>}
                </div>
                <div className="btn-row">
                  <a className="btn secondary" href={`/newsletter/${n.id}`} target="_blank" rel="noreferrer">
                    보기
                  </a>
                  <button className="btn danger" onClick={() => handleDelete(n.id)}>
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
