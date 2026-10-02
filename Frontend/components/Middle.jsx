import { useState } from "react";
import MatchControls from "./MatchControls";
import HistoryPanel from "./HistoryPanel";
import ProfileReport from "./report/ProfileReport";
import ProfileHeader from "./report/ProfileHeader";
import StatsStrip from "./report/StatsStrip";
import RoleFit from "./report/RoleFit";
import ReportSkeleton, { ControlsSkeleton } from "./report/ReportSkeleton";
import { useAnalysis } from "../src/hooks/useAnalysis";
import { useMatch } from "../src/hooks/useMatch";
import { useHistory } from "../src/hooks/useHistory";
import { useCommitActivity } from "../src/hooks/useCommitActivity";

const PDF = "application/pdf";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const PROMO = [
  [
    "Analysed the moment you sign in",
    "No button to hunt for — your report is already there, and it is reused on every visit instead of re-running.",
  ],
  [
    "See what we measured",
    "Your commit heatmap and repo quality score are computed from the GitHub API, not guessed — and the AI is given those numbers as fact.",
  ],
  [
    "Match any role",
    "Pick a target role and see your score for it, plus what your GitHub proves that your resume is missing.",
  ],
  [
    "Share your card",
    "Download the PNG and post it to LinkedIn or X, or drop it into applications.",
  ],
];

const Middle = ({ user, theme }) => {
  const isDark = theme === "dark";
  const { data, roles, loading, error, refresh } = useAnalysis(user?.login);
  const {
    jobRole,
    setJobRole,
    resume,
    setResume,
    result: matchResult,
    matching,
    error: matchError,
    match,
  } = useMatch();
  const { loading: activityLoading, error: activityError } =
    useCommitActivity(user?.login);
  const [fileError, setFileError] = useState("");
  const { history, clearing, error: historyError, clear } = useHistory(
    data?.analyzedAt ?? null,
  );

  const analysisReady = Boolean(data) && !loading;
  const roleFit = matchResult?.roleFit ?? null;
  const roleName = matchResult?.role ?? null;

  function rejectFile(message, input) {
    setFileError(message);
    setResume(null);
    if (input) input.value = "";
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileError("");
      setResume(null);
      return;
    }
    if (file.type !== PDF) return rejectFile("Please select a PDF file.", e.target);
    if (file.size > MAX_RESUME_BYTES)
      return rejectFile("Resume must be 5 MB or smaller.", e.target);
    setFileError("");
    setResume(file);
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 gap-5 sm:gap-6 pt-5 sm:pt-6 pb-4">
      {!data && user && loading && !error && (
        <>
          <div
            className="w-full max-w-6xl flex flex-col gap-6"
            aria-busy="true"
          >
            <div className="border border-edge bg-surface p-5 flex flex-col sm:flex-row items-center gap-5">
              <span className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-edge skeleton shrink-0" />
              <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
                <span className="h-7 w-48 skeleton" />
                <span className="h-3.5 w-full max-w-md skeleton" />
                <span className="h-3.5 w-2/3 max-w-sm skeleton" />
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                <span className="h-9 w-20 skeleton" />
                <span className="h-2.5 w-32 skeleton" />
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-line border border-line">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-surface p-3">
                  <span className="block h-6 w-10 mx-auto skeleton" />
                  <span className="block h-2.5 w-12 mx-auto mt-2 skeleton" />
                </div>
              ))}
            </div>
          </div>
          <ControlsSkeleton />
          <ReportSkeleton />
        </>
      )}

      {user && !data && !activityLoading && activityError && (
        <p className="text-muted text-xs text-center anim-fade-in">
          Commit activity unavailable right now — {activityError}
        </p>
      )}

      {}
      {data && (
        <div className="w-full max-w-6xl flex flex-col gap-6 anim-cascade">
          <ProfileHeader data={data} />
          <StatsStrip stats={data.stats} />
        </div>
      )}

      {}
      {analysisReady && (
        <MatchControls
          roles={roles}
          jobRole={jobRole}
          onJobRoleChange={setJobRole}
          resume={resume}
          onResumeChange={handleFileChange}
          onRemoveResume={() => {
            setFileError("");
            setResume(null);
          }}
          onMatch={match}
          matching={matching}
          disabled={!analysisReady}
          error={fileError || matchError}
          analysis={data}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}

      {}
      {analysisReady && roleFit && (
        <RoleFit role={roleName} fit={roleFit} className="w-full max-w-6xl" />
      )}

      {loading && !data && (
        <p className="text-muted text-sm anim-fade-in w-full max-w-6xl text-center">
          Analyzing your profile — this runs once and is then saved…
        </p>
      )}

      {error && !data && (
        <p className="text-muted text-center anim-fade-in max-w-6xl">{error}</p>
      )}

      {data && <ProfileReport data={data} isDark={isDark} />}

      {user && history.length > 0 && (
        <section className="w-full max-w-6xl border border-edge bg-surface p-5 anim-cascade">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-medium">Your Progress</h2>
            <div className="flex items-center gap-3">
              {historyError && <span className="text-xs">{historyError}</span>}
              <span className="text-xs text-muted">{history.length} snapshots</span>
              <button
                type="button"
                onClick={clear}
                disabled={clearing}
                className="border border-edge px-2 py-1 text-xs text-muted
                  cursor-pointer transition-colors hover:bg-ink hover:text-on-ink
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? "Clearing…" : "Clear"}
              </button>
            </div>
          </div>
          <HistoryPanel snapshots={history} />
        </section>
      )}

      <section className="w-full max-w-6xl border border-edge bg-surface p-5">
        <h3 className="font-medium mb-4">Get the most out of DevLens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROMO.map(([title, desc]) => (
            <div key={title} className="border border-line p-4 lift">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted text-xs mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-6xl mt-auto pt-4 pb-2 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-muted">
        <p>copyright &copy; 2026 Dev-Lens. All rights reserved.</p>
        <p>Built with GitHub API &amp; Groq</p>
      </div>
    </main>
  );
};

export default Middle;
