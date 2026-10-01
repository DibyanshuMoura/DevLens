import React from "react";
import { SkillIcon } from "../src/lib/skillIcons";

const SignInButton = ({ onSignIn }) => (
  <button
    type="button"
    onClick={onSignIn}
    className="mt-8 flex items-center gap-2 bg-ink text-on-ink px-6 py-3 text-sm
      hover:bg-ink/90 cursor-pointer transition-colors anim-pop-in"
  >
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
    Sign in with GitHub to analyze
  </button>
);

const features = [
  {
    title: "Profile Snapshot",
    desc: "Repos, followers, stars, forks and account age distilled into one clean view.",
  },
  {
    title: "AI Profile Score",
    desc: "A 0-100 score that rates the overall strength of your public profile.",
  },
  {
    title: "Skill Extraction",
    desc: "Surfaces the technologies your work actually demonstrates — not what you claim.",
  },
  {
    title: "Activity Insights",
    desc: "Consistency, community reach and focus of your recent contributions.",
  },
  {
    title: "Resume Cross-Check",
    desc: "Attach a resume PDF and see exactly where it agrees or contradicts GitHub.",
  },
  {
    title: "Progress Tracking",
    desc: "Every analysis is snapshotted — compare your score over time as you improve.",
  },
  {
    title: "Top Repositories",
    desc: "Your strongest projects, ranked by stars, surfaced automatically.",
  },
  {
    title: "Downloadable Report",
    desc: "One click exports the full report as a shareable PNG — score, stats, tech stack and top repos in one image.",
  },
  {
    title: "Recruiter-Ready Reports",
    desc: "Concrete strengths, weaknesses and next steps — written like a hiring manager would.",
  },
  {
    title: "Whole Profile, One Page",
    desc: "Sign in and your entire public profile is decoded into one structured report — nothing to assemble.",
  },
  {
    title: "GitHub Sign-In",
    desc: "One click with GitHub OAuth — no passwords, no forms, no username to type.",
  },
  {
    title: "Live GitHub Data",
    desc: "Every analysis is pulled live from the GitHub API at run time — nothing stale or hand-entered.",
  },
];

const steps = [
  {
    title: "Sign in",
    desc: "One click with GitHub — no passwords, no setup.",
  },
  {
    title: "Hit analyze",
    desc: "We use the GitHub account you signed in with — no typing needed.",
  },
  {
    title: "Get the report",
    desc: "Score, skills, activity insights and improvements in seconds.",
  },
  {
    title: "Track progress",
    desc: "Re-analyze anytime and compare against previous snapshots.",
  },
];

const reportMock = {
  initials: "JD",
  name: "John Doe",
  summary: "Full-stack developer building AI tools and web platforms.",
  score: 78,
  stats: [
    { label: "Repos", value: "48" },
    { label: "Followers", value: "312" },
    { label: "Stars", value: "1.2k" },
    { label: "Forks", value: "204" },
    { label: "Active", value: "12" },
    { label: "Yrs", value: "4" },
  ],
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
  activity: [
    {
      title: "Consistency",
      detail: "Commits in 4 of the last 5 months — 18 active weeks.",
    },
    {
      title: "Community reach",
      detail: "PRs and issues across 6 repositories this quarter.",
    },
  ],
  strengths: [
    "Consistent release cadence across 12 active repositories",
    "Strong full-stack signal: frontend, API and infrastructure",
  ],
  weaknesses: ["Readme quality uneven on your three most-starred repos"],
  improvements: ["Pin a flagship project and add setup docs + live demo"],
  trend: { prev: 72, now: 78 },
};

const Landing = ({ onSignIn, theme }) => {
  const isDark = theme === "dark";
  return (
    <section className="w-full max-w-4xl flex flex-col items-center text-center anim-cascade pt-2 pb-10 sm:pb-16">
      {/* Hero */}          <p className="text-muted text-xs sm:text-sm tracking-[0.25em] uppercase">
        AI-powered GitHub analysis
      </p>

      <h2 className="text-3xl sm:text-5xl font-bold mt-5 leading-tight max-w-2xl">
        Understand your GitHub profile
        <br />
        the way recruiters do.
      </h2>

      <p className="text-muted mt-6 max-w-xl leading-relaxed">
        DevLens turns public GitHub data — and your resume, if you upload one —
        into a clear, structured report: what stands out, what is missing, and
        exactly what to improve next. Then it remembers, so you can watch the
        numbers move.
      </p>

      <SignInButton onSignIn={onSignIn} />

      <p className="text-muted text-xs mt-3">
        Free · No card required · Your data stays local
      </p>

      {/* Mock report preview — mirrors the real analysis report */}
      <p className="text-muted text-xs tracking-[0.25em] uppercase mt-20 sm:mt-28">
        sample report
      </p>
      <div className="w-full max-w-2xl border border-edge bg-surface mt-4 text-left anim-fade-up">
        {/* Profile header + score */}
        <div className="flex items-center gap-4 border-b border-line p-5">
          <span className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border border-edge
            flex items-center justify-center font-bold text-lg shrink-0">
            {reportMock.initials}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight">{reportMock.name}</p>
            <p className="text-muted text-xs mt-0.5 truncate">{reportMock.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums">
              {reportMock.score}
            </span>
            <span className="text-[9px] text-muted uppercase tracking-widest">
              profile score / 100
            </span>
            <div className="h-1.5 w-24 sm:w-28 bg-line overflow-hidden">
              <div className="h-full bg-ink" style={{ width: `${reportMock.score}%` }} />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-line border-b border-line">
          {reportMock.stats.map((s) => (
            <div key={s.label} className="bg-surface p-2 text-center">
              <p className="font-bold text-sm tabular-nums">{s.value}</p>
              <p className="text-[9px] text-muted uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tech stack + activity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border-b border-line">
          <div className="bg-surface p-4">
            <p className="text-xs font-medium mb-2">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {reportMock.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 border border-line
                    px-1.5 py-0.5 text-[11px]"
                >
                  <SkillIcon skill={s} isDark={isDark} />
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-surface p-4 sm:col-span-2">
            <p className="text-xs font-medium mb-2">Activity Insights</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reportMock.activity.map((a) => (
                <div key={a.title} className="border border-line p-2">
                  <p className="text-xs font-medium">{a.title}</p>
                  <p className="text-muted text-[11px] mt-0.5 leading-snug">{a.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strengths / weaknesses / improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border-b border-line">
          {[
            ["Strengths", reportMock.strengths],
            ["Weaknesses", reportMock.weaknesses],
            ["Improvements", reportMock.improvements],
          ].map(([title, items]) => (
            <div key={title} className="bg-surface p-4">
              <p className="text-xs font-medium mb-1.5">{title}</p>
              <ul className="text-muted text-[11px] leading-snug space-y-1">
                {items.map((t) => (
                  <li key={t} className="flex gap-1.5">
                    <span aria-hidden="true">&middot;</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Progress trend */}
        <div className="flex items-center justify-between px-4 py-3 text-xs">
          <span className="text-muted">Your progress</span>
          <span className="font-medium tabular-nums">
            {reportMock.trend.prev} &rarr; {reportMock.trend.now}
            <span className="text-muted font-normal">
              {" "}(+{reportMock.trend.now - reportMock.trend.prev} vs last snapshot)
            </span>
          </span>
        </div>
      </div>

      {/* Features */}
      <h3 id="features" className="text-2xl sm:text-3xl font-bold mt-24 sm:mt-32 scroll-mt-24">
        Everything the report covers
      </h3>
      <p className="text-muted mt-3 max-w-lg">
        One analysis. Eight signals. No dashboard clutter.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line mt-10 w-full">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-surface p-5 text-left flex flex-col gap-2 hover:bg-ink hover:text-on-ink transition-colors group"
          >
            <h4 className="font-medium text-sm">{f.title}</h4>
            <p className="text-muted group-hover:text-line text-xs leading-relaxed transition-colors">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <h3 id="how-it-works" className="text-2xl sm:text-3xl font-bold mt-24 sm:mt-32 scroll-mt-24">
        How it works
      </h3>
      <p className="text-muted mt-3 max-w-lg">
        From sign-in to a full report in under a minute.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-line border border-line mt-10 w-full">
        {steps.map((s, i) => (
          <div key={s.title} className="bg-surface p-5 text-left flex flex-col gap-2">
            <span className="text-2xl font-bold text-line">{i + 1}</span>
            <h4 className="font-medium text-sm">{s.title}</h4>
            <p className="text-muted text-xs leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <h3 className="text-2xl sm:text-3xl font-bold mt-24 sm:mt-32 max-w-xl">
        Your profile is already public.
        <br />
        Make sure it works for you.
      </h3>

      <SignInButton onSignIn={onSignIn} />

      <p className="text-muted text-xs mt-3 mb-6">
        Takes ~30 seconds · Re-analyze anytime
      </p>
    </section>
  );
};

export default Landing;
