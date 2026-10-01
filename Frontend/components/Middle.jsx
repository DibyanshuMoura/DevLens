import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import HistoryPanel from "./HistoryPanel";
import { getToken } from "../src/lib/auth";
import { SkillIcon } from "../src/lib/skillIcons";

const API_URL = import.meta.env.VITE_API_URL;

const Middle = ({ user, theme }) => {
  const isDark = theme === "dark";
  const fileInputRef = useRef(null);
  const cardRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cardError, setCardError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [data, setData] = useState(null);
  const [resume, setResume] = useState(null);
  const [history, setHistory] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadRoles() {
      try {
        const res = await fetch(`${API_URL}/roles`);
        if (!res.ok) throw new Error("failed");
        const { roles: list } = await res.json();
        if (!cancelled) setRoles(list || []);
      } catch {
        if (!cancelled) setRoles([]);
      }
    }
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      const token = getToken();
      if (!token) {
        setHistory([]);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("failed");
        const { snapshots } = await res.json();
        if (!cancelled) setHistory(snapshots || []);
      } catch {
        if (!cancelled) setHistory([]);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleClearHistory() {
    if (!window.confirm("Delete all snapshots? This cannot be undone.")) {
      return;
    }
    const token = getToken();
    if (!token) return;
    setClearError("");
    setClearing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("clear failed");
      setHistory([]);
    } catch {
      setClearError("Couldn't clear snapshots — try again.");
    } finally {
      setClearing(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setFetchError("");
    if (!file) {
      setResume(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setFetchError("Please select a PDF file.");
      e.target.value = "";
      setResume(null);
      return;
    }
    setResume(file);
  }

  function removeResume() {
    setResume(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** Export the profile card node as a 2x PNG and trigger a download. */
  async function downloadCard() {
    if (!cardRef.current || exporting) return;
    setCardError("");
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        width: 720,
        height: 1000,
        backgroundColor: "#0a0a0a",
      });
      const a = document.createElement("a");
      a.download = `devlens-${data?.name || "profile"}-card.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      setCardError(err.message || "Could not generate the card image.");
    } finally {
      setExporting(false);
    }
  }

  async function handleAnalyze() {
    setData(null);
    setFetchError("");

    try {
      setLoading(true);

      const formData = new FormData();
      if (resume) formData.append("resume", resume);
      if (jobRole) formData.append("role", jobRole);

      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze profile");
      }

      setData(result);
      if (token) {
        try {
          const hRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (hRes.ok) {
            const { snapshots } = await hRes.json();
            setHistory(snapshots || []);
          }
        } catch {
          /* non-fatal */
        }
      }
    } catch (err) {
      setFetchError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function render(arr = []) {
    return arr.map((item, index) => <li key={index}>{item}</li>);
  }

  function fmt(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  const stats = data?.stats;
  const statItems = stats
    ? [
        { label: "Repos", value: fmt(stats.repos) },
        { label: "Followers", value: fmt(stats.followers) },
        { label: "Stars", value: fmt(stats.stars) },
        { label: "Forks", value: fmt(stats.forks) },
        { label: "Active", value: fmt(stats.activeRepos) },
        { label: "Yrs", value: stats.accountAgeYears },
      ]
    : [];

  const score = typeof data?.res?.score === "number" ? data.res.score : null;

  return (
    <main className="w-full flex-1 flex flex-col items-center px-6 gap-8 pt-6 pb-6">
      {/* CTA — no username input: the signed-in account is the target */}
      <section className="w-full max-w-6xl flex flex-col items-center text-center mt-6 anim-fade-up">
        <p className="text-muted text-xs tracking-[0.25em] uppercase">
          analyzing {user?.login || "your profile"}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold mt-3">
          Your GitHub, decoded.
        </h2>
        <p className="text-muted mt-4 max-w-lg leading-relaxed">
          Score, tech stack, activity insights and improvements — pulled live
          from your profile. Attach a resume to cross-check it against your
          public work.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
          {resume ? (
            <div className="anim-pop-in flex items-center gap-2 border border-edge px-3 py-2 text-sm max-w-full">
              <span
                className="truncate max-w-[180px] sm:max-w-[260px]"
                title={resume.name}
              >
                {resume.name}
              </span>
              <span className="text-muted whitespace-nowrap">
                {(resume.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={removeResume}
                className="ml-1 text-muted hover:text-ink cursor-pointer"
                aria-label="Remove resume"
                disabled={loading}
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="border border-dashed border-line-strong px-4 py-2.5 text-sm
              cursor-pointer hover:border-ink hover:bg-ink hover:text-on-ink
              disabled:cursor-not-allowed">
              + Upload Resume (PDF)
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>
          )}

          <select
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            disabled={loading || roles.length === 0}
            aria-label="Target job role"
            className="border border-edge bg-surface px-3 py-2.5 text-sm cursor-pointer
              hover:border-ink focus:outline-none focus:border-ink disabled:opacity-60
              disabled:cursor-not-allowed max-w-[240px] truncate"
          >
            <option value="">Target job role…</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            className="px-10 py-2.5 bg-ink text-on-ink hover:bg-ink/90 cursor-pointer
              disabled:cursor-not-allowed transition-colors"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing…" : "Analyze my profile"}
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 mt-6 anim-fade-in">
            <p className="text-sm text-muted">
              {resume
                ? "Reading resume & analyzing profile…"
                : "Analyzing profile…"}
            </p>
            <div className="loading-bar" />
          </div>
        )}

        {fetchError && (
          <p className="text-muted text-center anim-fade-in mt-4">{fetchError}</p>
        )}
      </section>

      {data && (
        <article className="w-full max-w-6xl flex flex-col gap-6 anim-cascade">
          {/* Profile header + score */}
          <div className="border border-edge bg-surface p-5 flex flex-col sm:flex-row items-center gap-5">
            <img
              src={data.dp}
              alt={data.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-edge anim-pop-in shrink-0"
            />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <a
                href={data.id}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-bold hover:underline break-all"
              >
                {data.name}
              </a>
              <p className="text-muted text-sm mt-1 leading-relaxed">
                {data.res?.summary}
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1 min-w-[150px]">
              <span className="text-4xl font-bold tabular-nums">
                {score ?? "–"}
              </span>
              <span className="text-[10px] text-muted uppercase tracking-widest">
                profile score / 100
              </span>
              <div className="h-1.5 w-32 bg-line overflow-hidden">
                <div
                  className="score-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, score ?? 0))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats strip */}
          {statItems.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-line border border-line">
              {statItems.map((s) => (
                <div key={s.label} className="bg-surface p-3 text-center">
                  <p className="font-bold text-xl tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tech stack + activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="border border-edge bg-surface p-5">
              <h3 className="font-medium mb-3">Tech Stack</h3>
              {data.res?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.res.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 border border-edge
                        px-2.5 py-1 text-sm anim-pop-in"
                    >
                      <SkillIcon skill={s} isDark={isDark} />
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No skills detected.</p>
              )}
              {stats?.languages?.length > 0 && (
                <p className="text-muted text-xs mt-4">
                  Top languages: {stats.languages.join(", ")}
                </p>
              )}
            </section>

            <section className="lg:col-span-2 border border-edge bg-surface p-5">
              <h3 className="font-medium mb-3">Activity Insights</h3>
              {data.res?.activity?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 anim-stagger">
                  {data.res.activity.map((a) => (
                    <div key={a.title} className="border border-line p-3">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-muted text-xs mt-1 leading-relaxed">
                        {a.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No activity data.</p>
              )}
            </section>
          </div>

          {/* Strengths / Weaknesses / Improvements — three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ["Strengths", data.res?.strengths],
              ["Weaknesses", data.res?.weaknesses],
              ["Improvements", data.res?.improvements],
            ].map(
              ([title, arr]) =>
                arr?.length > 0 && (
                  <section key={title} className="border border-edge bg-surface p-5">
                    <h3 className="font-medium mb-3">{title}</h3>
                    <ul className="list-disc pl-5 wrap-break-word anim-stagger text-sm space-y-1.5">
                      {render(arr)}
                    </ul>
                  </section>
                ),
            )}
          </div>

          {/* Resume cross-check */}
          {data.res?.resumeMatch?.length > 0 && (
            <section className="border border-edge bg-surface p-5">
              <h3 className="font-medium mb-3">Resume ↔ GitHub Match</h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 anim-stagger">
                {data.res.resumeMatch.map((m, i) => (
                  <li key={i} className="border border-line p-3 text-sm leading-relaxed">
                    {m}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Role fit — only shown when a job role was selected */}
          {data.res?.roleFit && (
            <section className="border border-edge bg-surface p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div>
                  <h3 className="font-medium">
                    Role Fit — {data.role || "target role"}
                  </h3>
                  <p className="text-muted text-xs mt-0.5">
                    Add these to your resume to boost your chances for{" "}
                    {data.role || "the selected role"}.
                  </p>
                </div>
                {typeof data.res.roleFit.score === "number" && (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-2xl font-bold tabular-nums">
                      {data.res.roleFit.score}
                      <span className="text-muted text-sm font-normal">/100</span>
                    </span>
                    <div className="h-1.5 w-28 bg-line overflow-hidden">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, data.res.roleFit.score),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {data.res.roleFit.summary && (
                <p className="text-sm leading-relaxed mb-4">
                  {data.res.roleFit.summary}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.res.roleFit.strengths?.length > 0 && (
                  <div className="border border-line p-3">
                    <p className="font-medium text-sm mb-2">
                      Working in your favor
                    </p>
                    <ul className="list-disc pl-5 wrap-break-word text-sm space-y-1.5 text-muted">
                      {render(data.res.roleFit.strengths)}
                    </ul>
                  </div>
                )}
                {data.res.roleFit.gaps?.length > 0 && (
                  <div className="border border-line p-3">
                    <p className="font-medium text-sm mb-2">
                      On GitHub but missing from your resume
                    </p>
                    <ul className="list-disc pl-5 wrap-break-word text-sm space-y-1.5 text-muted">
                      {render(data.res.roleFit.gaps)}
                    </ul>
                  </div>
                )}
              </div>

            </section>
          )}

          {/* Top repositories */}
          {stats?.topRepos?.length > 0 && (
            <section className="border border-edge bg-surface p-5">
              <h3 className="font-medium mb-3">Top Repositories</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.topRepos.map((r) => (
                  <a
                    key={r.name}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border border-line px-3 py-2 flex items-center
                      justify-between gap-2 hover:border-ink transition-colors"
                  >
                    <span className="truncate font-medium text-sm">{r.name}</span>
                    <span className="text-muted text-xs whitespace-nowrap">
                      ★ {fmt(r.stars)}
                      {r.language ? ` · ${r.language}` : ""}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Downloadable profile card — preview removed, export-only */}
          <section className="border border-edge bg-surface p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-medium">Profile Card</h3>
                <p className="text-muted text-xs mt-0.5">
                  Your report as a shareable image — exported at 2x resolution.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadCard}
                disabled={exporting}
                className="bg-ink text-on-ink px-4 py-1.5 text-sm hover:bg-ink/90
                  cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {exporting ? "Preparing…" : "Download Card (PNG)"}
              </button>
            </div>

            {cardError && (
              <p className="text-muted text-sm mt-3 anim-fade-in">{cardError}</p>
            )}

            {/* Export node — kept out of the visible layout so the card can
                still be rendered to PNG without being previewed. */}
            <div
              aria-hidden="true"
              style={{
                position: "fixed",
                left: -12000,
                top: 0,
                pointerEvents: "none",
              }}
            >              <div
                ref={cardRef}
                className="shrink-0"
                style={{
                  width: 720,
                  height: 1000,
                  padding: "64px 56px",
                  background: "#0a0a0a",
                  color: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Block 1: identity — photo top center */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={data.dp}
                    crossOrigin="anonymous"
                    alt=""
                    className="shrink-0 rounded-full"
                    style={{ width: 200, height: 200, border: "3px solid #404040" }}
                  />
                  <p
                    className="font-bold text-center"
                    style={{
                      fontSize: 44,
                      lineHeight: 1.1,
                      marginTop: 32,
                      maxWidth: 560,
                    }}
                  >
                    {data.name}
                  </p>
                  <p
                    className="text-center"
                    style={{
                      fontSize: 17,
                      lineHeight: 1.3,
                      color: "#a3a3a3",
                      marginTop: 10,
                    }}
                  >
                    {data.id?.replace("https://", "")}
                  </p>
                </div>

                {/* Block 2: tech stack + quote */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {data.res?.skills?.length > 0 && (
                    <>
                      <p
                        className="uppercase text-center"
                        style={{
                          fontSize: 12,
                          color: "#737373",
                          letterSpacing: "0.3em",
                        }}
                      >
                        Tech Stack
                      </p>
                      <div
                        className="flex flex-wrap justify-center"
                        style={{
                          gap: 12,
                          marginTop: 18,
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        {data.res.skills.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            style={{
                              border: "1px solid #525252",
                              color: "#e5e5e5",
                              padding: "9px 16px",
                              fontSize: 16,
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {data.res?.quote && (
                    <p
                      className="text-center"
                      style={{
                        fontSize: 20,
                        fontStyle: "italic",
                        lineHeight: 1.55,
                        color: "#d4d4d4",
                        maxWidth: 520,
                        marginTop: data.res?.skills?.length > 0 ? 44 : 0,
                      }}
                    >
                      “{data.res.quote}”
                    </p>
                  )}
                </div>

                {/* Block 3: stats + credit */}
                <div style={{ width: "100%" }}>
                  <p
                    className="uppercase text-center"
                    style={{
                      fontSize: 12,
                      color: "#737373",
                      letterSpacing: "0.3em",
                      marginBottom: 18,
                    }}
                  >
                    Stats
                  </p>
                  <div
                    className="grid grid-cols-3"
                    style={{
                      borderTop: "1px solid #333",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    {statItems.slice(0, 6).map((s, i) => (
                      <div
                        key={s.label}
                        className="text-center"
                        style={{
                          padding: "20px 0",
                          borderRight:
                            i % 3 < 2 ? "1px solid #262626" : "none",
                          borderBottom:
                            i < 3 ? "1px solid #262626" : "none",
                        }}
                      >
                        <p
                          className="font-bold tabular-nums"
                          style={{ fontSize: 30, lineHeight: 1 }}
                        >
                          {s.value}
                        </p>
                        <p
                          className="uppercase"
                          style={{
                            fontSize: 12,
                            lineHeight: 1.2,
                            color: "#a3a3a3",
                            letterSpacing: "0.15em",
                            marginTop: 8,
                          }}
                        >
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    className="text-center"
                    style={{
                      fontSize: 13,
                      lineHeight: 1.3,
                      color: "#a3a3a3",
                      marginTop: 18,
                    }}
                  >
                    Analyzed with{" "}
                    <span style={{ color: "#fafafa", fontWeight: 700 }}>DevLens</span>
                    {" · "}
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </article>
      )}

      {/* Progress history */}
      {user && history.length > 0 && (
        <section className="w-full max-w-6xl border border-edge bg-surface p-5 anim-cascade">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-medium">Your Progress</h2>
            <div className="flex items-center gap-3">
              {clearError && (
                <span className="text-xs">{clearError}</span>
              )}
              <span className="text-xs text-muted">
                {history.length} snapshots
              </span>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing}
                className="border border-edge px-2 py-1 text-xs text-muted
                  cursor-pointer transition-colors hover:bg-ink hover:text-on-ink
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? "Clearing\u2026" : "Clear"}
              </button>
            </div>
          </div>
          <HistoryPanel snapshots={history} />
        </section>
      )}

      {/* Bottom content (footer is hidden while signed in) */}
      <section className="w-full max-w-6xl border border-edge bg-surface p-5">
        <h3 className="font-medium mb-4">Get the most out of DevLens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            [
              "Track your progress",
              "Re-run the analysis over time — every run is snapshotted so you can compare scores and stats.",
            ],
            [
              "Cross-check your resume",
              "Attach a PDF and the report calls out where your resume and public work disagree.",
            ],
            [
              "Share your card",
              "Download the PNG and post it to LinkedIn or X, or drop it into applications.",
            ],
          ].map(([title, desc]) => (
            <div key={title} className="border border-line p-4">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted text-xs mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-6xl mt-auto pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-muted">
        <p>copyright &copy; 2026 Dev-Lens. All rights reserved.</p>
        <p>Built with GitHub API &amp; Groq</p>
      </div>
    </main>
  );
};

export default Middle;
