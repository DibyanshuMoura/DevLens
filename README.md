# DevLens

**Know exactly how your GitHub profile reads to a hiring manager — then fix it.**

DevLens signs in with GitHub, measures your public profile, and produces a report
that separates what was *measured* from what the AI *wrote*. Commit activity and
repository hygiene are computed in code and handed to the model as ground truth,
so the prose cites real numbers instead of guessing. Pick a target role, attach a
resume, and it tells you what your GitHub proves that your resume never claims.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Measured vs. AI Output](#measured-vs-ai-output)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Data Model](#data-model)
- [Design Notes](#design-notes)
- [Known Limits](#known-limits)

---

## What It Does

**Analyses on sign-in.** There is no "Analyze" button. Sign in and the report is
already computed — and reused on every later visit instead of re-running.

**Measures before it writes.** Two sections are pure arithmetic, not AI output:

- a **commit heatmap** across your most recently pushed repositories, with
  current/longest streak, active days and peak day
- a **repository quality checklist** — six deterministic hygiene checks
  (description, topics, license, freshness, demo link, tests) scored per repo,
  plus profile-wide coverage

Everything the model writes is handed those measured numbers as a *Verified
Signals* block, so the narrative stays consistent with the charts above it.

**Matches you to a role.** Pick any of 20 target roles and get a fit score with
strengths, gaps, and a six-step roadmap of what to learn and build next.

**Reads your resume.** Upload a PDF (optional). Its text is injected into the
prompt and cross-checked against your GitHub — surfacing projects and skills that
are publicly visible but missing from the resume itself. Nothing is stored on
disk; the text lives only for the request.

**Tracks progress.** Each analysis appends a snapshot, so you can compare score,
commits, and repo quality over time on a trend chart.

**Never leaves you empty-handed.** If GitHub's hourly rate limit is exhausted,
the last saved analysis is served with a clear "this is cached" notice instead of
an error.

---

## Quick Start

**Requirements:** Node.js 20+, a MongoDB Atlas connection string, a Groq API key,
and (for sign-in) a GitHub OAuth app.

```bash
git clone git@github.com:DibyanshuMoura/DevLens.git
cd DevLens

# Backend
cd Backend
npm install
cp .env.example .env     # then fill it in — see Configuration
npm start

# Frontend (new terminal)
cd Frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

> The backend refuses to start without `MONGODB_URI` — it exits rather than
> running half-configured.

---

## How It Works

Sign-in and analysis are a single step.

1. You sign in with GitHub. The signed-in account **is** the analysis target.
2. The frontend requests `GET /analysis` for your last saved analysis.
3. If one exists and is under an hour old it renders immediately —
   **no GitHub call, no LLM call**.
4. Otherwise `POST /analyze` runs:
   - resolves your username from the verified JWT
   - fetches GitHub profile + repository data
   - computes commit activity and repository quality as verified signals
   - sends the profile to Groq for score, summary, skills, strengths,
     weaknesses and improvements
   - saves to `analyses` (for reuse and rate-limit fallback) and appends a
     `snapshots` row (for history)
5. If GitHub's rate limit is hit and you have a saved analysis, that is returned
   with `cached: true` and a visible notice.

Role matching is a separate, cheap step:

6. You pick a target role and optionally attach a resume PDF.
7. `POST /match` reads the **saved** analysis and asks Groq for one `roleFit`
   block — **zero GitHub requests**, roughly two seconds.
8. Matches are never stored. Every run reflects your profile as it is right now,
   so nothing stale is ever shown and a reload clears it.

### Sessions

OAuth returns a **7-day JWT**, stored in `localStorage` and sent as a
`Bearer` token. On return visits the app decodes that token synchronously and
paints your report immediately, then reconciles with `/auth/me` in the background —
so you never see the landing page while already signed in.

---

## Measured vs. AI Output

This separation is the core design decision of the project.

| Section | Source |
| --- | --- |
| Commit heatmap, streaks, peak day | **Measured** — GitHub commits API |
| Repository quality score and checklists | **Measured** — GitHub repos payload |
| Stats strip, top repositories, languages | **Measured** — GitHub REST API |
| Summary, skills, strengths/weaknesses | Groq LLM |
| Role fit, roadmap, resume cross-check | Groq LLM (resume text + measured signals) |

The measured sections are also optional in the UI: if GitHub returns no activity,
the heatmap simply does not render, and a failed activity fetch never fails the
analysis.

---

## Configuration

### Backend — `Backend/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB Atlas connection string |
| `GROQ_API_KEY` | yes | Groq API key |
| `GROQ_MODEL` | no | Defaults to `openai/gpt-oss-120b` |
| `PORT` | no | Defaults to `3000` |
| `GITHUB_CLIENT_ID` | for login | GitHub OAuth app client id |
| `GITHUB_CLIENT_SECRET` | for login | GitHub OAuth app client secret |
| `JWT_SECRET` | for login | Any long random string |
| `APP_URL` | for login | Public backend origin |
| `FRONTEND_URL` | for login | Public frontend origin |

Without the four OAuth variables the app still runs — the sign-in button simply
returns a "not configured" notice.

> **Deployment gotcha.** `APP_URL` and `FRONTEND_URL` must be **HTTPS** in
> production. A `FRONTEND_URL` of `http://your-app.vercel.app` makes the OAuth
> callback redirect from an HTTPS page to an HTTP one, which browsers block as
> mixed content — the token never arrives and you appear stuck on the landing
> page. `auth.js` now forces HTTPS for any non-localhost host as a safeguard, but
> set the correct values anyway.

### GitHub OAuth setup

1. Create an app at <https://github.com/settings/developers>
2. Set the callback URL to `http://localhost:3000/auth/github/callback`
   (your backend origin in production)
3. Put the client id and secret in `Backend/.env`

### Frontend — `Frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

This is **baked in at build time**, not read at runtime. On Vercel, set it as an
environment variable on the frontend project — otherwise the deployed bundle
keeps pointing at `localhost`.

---

## Project Structure

```txt
DevLens/
├── Backend/
│   ├── server.js          # routes, prompt construction, Groq calls
│   ├── auth.js            # GitHub OAuth, JWT issue/verify, route guards
│   ├── github.js          # profile + repo fetch, stat computation, cache
│   ├── activity.js        # commit activity from the repositories commits API
│   ├── quality.js         # deterministic repository hygiene scoring
│   ├── analyses.js        # save / reuse / rate-limit fallback
│   ├── history.js         # snapshot append and pruning
│   ├── db.js              # Mongo connection
│   ├── models/            # User, Analysis, Snapshot
│   ├── test/              # node:test unit tests
│   └── .env
├── Frontend/
│   ├── src/
│   │   ├── App.jsx        # session bootstrap, theme, layout switch
│   │   ├── hooks/         # useAnalysis, useMatch, useHistory, useCommitActivity
│   │   └── lib/           # api.js, auth.js, format.js, skillIcons.jsx
│   ├── components/
│   │   ├── Landing.jsx    # signed-out page
│   │   ├── Middle.jsx     # signed-in layout, composes the sections below
│   │   ├── Header.jsx     # sticky blurred nav + theme toggle
│   │   ├── MatchControls.jsx
│   │   ├── HistoryPanel.jsx
│   │   └── report/        # the report sections
│   ├── test/              # node:test unit tests
│   └── vite.config.js
├── Screenshots/
└── README.md
```

---

## Scripts

| Command | Where | Does |
| --- | --- | --- |
| `npm start` | Backend | Runs the API |
| `npm test` | Backend | Unit tests (`node:test`) |
| `npm run dev` | Frontend | Vite dev server |
| `npm run build` | Frontend | Production build to `dist/` |
| `npm run lint` | Frontend | ESLint |
| `npm test` | Frontend | Unit tests (`node:test`) |

Tests use Node's built-in runner — no test framework dependency.

---

## Data Model

MongoDB Atlas holds three collections:

- **`users`** — upserted on every OAuth login, keyed by GitHub's numeric id
  (stable even if the username changes)
- **`snapshots`** — one row per analysis, indexed by `{ login, createdAt }`,
  capped at the last **20** per user
- **`analyses`** — the full analysis payload, capped at the last **5** per user.
  This is what makes sign-in instant and what the rate-limit fallback serves.
  Role matches are never stored here.

---

## Design Notes

The source carries no inline comments. The decisions that are easy to get wrong
are recorded here instead.

**Do not use the GitHub Events API for commit counts.** It looks like the obvious
source, but GitHub removed `payload.size` and `payload.commits` from `PushEvent` —
a push payload is now only `{ repository_id, push_id, ref, head, before }`. An
implementation built on it silently returns nothing. Commit activity is read from
`/repos/{owner}/{repo}/commits` instead. (This shipped broken once before this
note existed.)

**Commit activity covers only part of a profile, by design.** A year of commits
costs one request per repository against a 60/hour unauthenticated limit, so only
the **8** most recently pushed owned repositories are scanned, at most 3 pages
each, 3 at a time. Private repositories are never visible to GitHub's API, so
totals understate real work. The UI states this coverage rather than implying the
numbers are exhaustive.

**Rate limiting is handled by aborting, not retrying.** When GitHub's quota runs
out mid-scan the scan stops immediately and returns partial data flagged
`truncated`, rather than firing doomed requests at the remaining repositories.

**Caches exist because the quota is tiny.** Profile/repos responses are cached for
5 minutes and commit activity for 10. A cold load costs roughly 18 requests;
without the caches, a few page loads exhaust the hourly budget.

**Analyses are saved, role matches are not.** A stored analysis is what makes
sign-in instant and what the rate-limit fallback serves. A role match is always
recomputed, so nothing about it is persisted.

**A transient network failure must not log you out.** `/auth/me` returns three
states, not two: `null` means genuinely unauthorized (401/403) and clears the
token; `undefined` means the request failed or the server errored, in which case
the cached session is kept. Without that distinction, a cold start on Render would
silently sign users out.

**Frontend URLs are normalized.** Any non-localhost origin is forced to HTTPS, so
a missing scheme in `FRONTEND_URL` cannot reintroduce the mixed-content redirect.
Localhost is explicitly exempt so local development keeps working.

**JWT payloads are base64url, not base64.** Decoding with `atob()` alone fails on
roughly half of all real tokens because `-` and `_` are not in the standard
alphabet. `decodeJwtPayload` normalizes the alphabet and pads before decoding.

**Prompt hardening is deliberate.** The LLM prompt carries explicit `STRICT RULES`
(JSON only, no markdown, no backticks) because the model otherwise wraps answers in
prose. Responses are parsed leniently and the Groq call retries with a
stricter-to-looser model sequence, since `gpt-oss` models intermittently fail
JSON-mode validation.

**OAuth tokens do not need refreshing.** The app uses a GitHub OAuth App, whose
tokens are long-lived and do not expire unless the user revokes them. GitHub
*Apps* are the ones with 8-hour expiry and refresh tokens.

**Loading states mirror the real layout.** Skeletons reproduce the report's grid,
column count and control heights rather than showing a single spinner, so nothing
reflows when data lands. This requires the skeleton to keep any `overflow-x-auto`
wrappers the real components have — a fixed-width heatmap without one forces the
whole page to scroll sideways on a phone.

**Stagger delays are driven by a CSS variable.** `.anim-stagger > *` reads
`--stagger-i`, set per child position, so the sequence is defined in one place and
capped so long lists do not crawl. It targets `> *` rather than `li` because most
usages are grids of `div`s — an `li` selector silently animates nothing.

---

## Known Limits

- **Private work is invisible.** GitHub's API never exposes private repositories,
  so the heatmap understates total output for anyone with private work. The UI
  labels this explicitly rather than hiding it.
- **The heatmap covers one calendar year**, and the Events API exposes roughly the
  last 90 days of public activity.
- **The unauthenticated GitHub limit is 60 requests/hour.** The caches and the
  saved-analysis reuse exist to stay under it; a cold analysis is the expensive
  path.
- **Render's free tier sleeps.** After ~15 minutes idle the service takes 30–50s
  to wake. Use a paid instance or a keep-alive ping if that matters.

---

## License

MIT

---

## Author

**Dibyanshu Moura**

- GitHub: <https://github.com/DibyanshuMoura>
- X: <https://x.com/DibyanshuMoura>

**Repository:** <https://github.com/DibyanshuMoura/DevLens>
