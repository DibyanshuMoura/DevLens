import { useEffect, useRef } from "react";
import { fmtDate } from "../src/lib/format";

const MatchControls = ({
  roles,
  jobRole,
  onJobRoleChange,
  resume,
  onResumeChange,
  onRemoveResume,
  onMatch,
  matching,
  disabled,
  error,
  analysis,
  onRefresh,
  refreshing,
}) => {
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!resume && fileInputRef.current?.value) {
      fileInputRef.current.value = "";
    }
  }, [resume]);

  const roleLabel = jobRole || "this role";

  return (
    <section className="w-full max-w-6xl border border-edge bg-surface p-5 anim-fade-up">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-medium">Match to a job role</h3>
          <p className="text-muted text-xs mt-0.5 leading-relaxed">
            Your profile is already analyzed. Pick a role to see how it scores,
            and attach a resume to find what your public work proves that the
            resume is missing.
          </p>
        </div>
      </div>

      {}
      {analysis?.cached && (
        <div
          className="flex items-center justify-between gap-3 flex-wrap mt-4
            border border-line px-3 py-2 anim-fade-in"
        >
          <p className="text-xs text-muted">
            {analysis.notice ??
              `Showing your analysis from ${fmtDate(analysis.analyzedAt)}.`}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-xs border border-edge px-2 py-1 cursor-pointer
              transition-colors hover:bg-ink hover:text-on-ink
              disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mt-4">
        {resume ? (
          <div className="anim-pop-in flex items-center gap-2 border border-edge px-3 py-2 text-sm max-w-full min-w-0">
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
              onClick={onRemoveResume}
              className="ml-1 text-muted hover:text-ink cursor-pointer"
              aria-label="Remove resume"
              disabled={matching}
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center border border-dashed border-line-strong px-4 py-2.5 text-sm
            cursor-pointer hover:border-ink hover:bg-ink hover:text-on-ink transition-colors">
            + Resume (PDF)
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={onResumeChange}
              disabled={matching}
            />
          </label>
        )}

        <select
          value={jobRole}
          onChange={(e) => onJobRoleChange(e.target.value)}
          disabled={matching || roles.length === 0}
          aria-label="Target job role"
          className="w-full sm:w-auto border border-edge bg-surface px-3 py-2.5 text-sm cursor-pointer
            hover:border-ink focus:outline-none focus:border-ink disabled:opacity-60
            disabled:cursor-not-allowed sm:max-w-[260px] truncate"
        >
          <option value="">Target job role…</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          className="w-full sm:w-auto px-6 sm:px-8 py-2.5 bg-ink text-on-ink hover:bg-ink/90
            cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors
            press text-center wrap-break-word"
          onClick={onMatch}
          disabled={matching || disabled || !jobRole}
        >
          {matching ? "Matching…" : `Match to ${roleLabel}`}
        </button>
      </div>

      {error && (
        <p className="text-muted text-sm mt-3 anim-fade-in">{error}</p>
      )}
    </section>
  );
};

export default MatchControls;
