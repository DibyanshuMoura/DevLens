import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Panel } from "./Panel";

const CARD = {
  width: 720,
  height: 1000,
  padding: "64px 56px",
  background: "#0a0a0a",
  color: "#fafafa",
};

const ProfileCard = ({ data }) => {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const stats = [
    { label: "Repos", value: data.stats?.repos },
    { label: "Followers", value: data.stats?.followers },
    { label: "Stars", value: data.stats?.stars },
    { label: "Forks", value: data.stats?.forks },
    { label: "Active", value: data.stats?.activeRepos },
    { label: "Yrs", value: data.stats?.accountAgeYears },
  ].map((s) => ({
    ...s,
    value:
      typeof s.value === "number" && s.value >= 1000
        ? `${(s.value / 1000).toFixed(1).replace(/\.0$/, "")}k`
        : String(s.value ?? "–"),
  }));

  async function download() {
    if (!cardRef.current || exporting) return;
    setError("");
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        width: CARD.width,
        height: CARD.height,
        backgroundColor: "#0a0a0a",
      });
      const a = document.createElement("a");
      a.download = `devlens-${data.name || "profile"}-card.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      setError(err.message || "Could not generate the card image.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Panel
      title="Profile Card"
      description="Your report as a shareable image — exported at 2x resolution."
      actions={
        <button
          type="button"
          onClick={download}
          disabled={exporting}
          className="bg-ink text-on-ink px-4 py-1.5 text-sm hover:bg-ink/90
            cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {exporting ? "Preparing…" : "Download Card (PNG)"}
        </button>
      }
    >
      {error && <p className="text-muted text-sm anim-fade-in">{error}</p>}

      {}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -12000,
          top: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={cardRef}
          className="shrink-0"
          style={{
            width: CARD.width,
            height: CARD.height,
            padding: CARD.padding,
            background: CARD.background,
            color: CARD.color,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {}
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
              style={{ fontSize: 17, lineHeight: 1.3, color: "#a3a3a3", marginTop: 10 }}
            >
              {data.id?.replace("https://", "")}
            </p>
          </div>

          {}
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
                  style={{ fontSize: 12, color: "#737373", letterSpacing: "0.3em" }}
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

          {}
          <div style={{ width: "100%" }}>
            <p
              className="uppercase text-center"
              style={{ fontSize: 12, color: "#737373", letterSpacing: "0.3em", marginBottom: 18 }}
            >
              Stats
            </p>
            <div
              className="grid grid-cols-3"
              style={{ borderTop: "1px solid #333", borderBottom: "1px solid #333" }}
            >
              {stats.slice(0, 6).map((s, i) => (
                <div
                  key={s.label}
                  className="text-center"
                  style={{
                    padding: "20px 0",
                    borderRight: i % 3 < 2 ? "1px solid #262626" : "none",
                    borderBottom: i < 3 ? "1px solid #262626" : "none",
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
              style={{ fontSize: 13, lineHeight: 1.3, color: "#a3a3a3", marginTop: 18 }}
            >
              Analyzed with{" "}
              <span style={{ color: "#fafafa", fontWeight: 700 }}>DevLens</span>
              {" · "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ProfileCard;
