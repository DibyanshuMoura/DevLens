# DevLens

DevLens is an AI-powered GitHub profile analysis platform that evaluates public GitHub accounts using repository metadata, activity patterns, and GitHub statistics. The application combines GitHub API data with LLM-generated insights to provide strengths, weaknesses, and actionable improvement suggestions for developers.

---

## Features

Automatic analysis on sign-in — no button to click. Your report is computed
once, saved, and reused on every visit; a small Refresh control re-runs it
on demand.
* Role matching is the only action — pick a target role and check the fit,
  optionally with a resume attached to that step
* Rate-limit fallback — if GitHub's quota is exhausted, the last saved
  analysis is served with a clear "this is cached" notice instead of an error
* Matching costs no GitHub requests: it reuses the saved analysis and makes a
  single small LLM call, so it stays fast and never trips the rate limit
* Upload a resume (PDF) to enrich the AI analysis with skills, projects, and experience from the resume
* GitHub OAuth sign-in with analysis history
* Progress tracking — compare score, repos, and stars against your previous analyses
* Commit activity heatmap — a contribution-grid view of public pushes over the
  last ~90 days, with current/longest streak, active days and peak day
* Repository quality checklist — deterministic per-repo hygiene scoring
  (description, topics, license, freshness, demo link, tests) plus profile-wide
  coverage, so improvement advice is verifiable rather than vague
* Verified signals block — commit and hygiene numbers are computed in code and
  passed to the LLM as ground truth, so it cites them instead of guessing
* Trend chart — score, commit volume and repo quality plotted across snapshots
* Fetch real-time GitHub data using the GitHub API
* In-memory response cache and rate-limit aware errors (unauthenticated GitHub
  allows only 60 requests/hour)
* AI profile score (0-100) with a plain-language summary
* Skill extraction from GitHub data and resume
* Activity insights (consistency, community, top project)
* Top repositories ranked by stars
* Display GitHub profile information
* Analyze repository statistics and activity
* Calculate total stars across repositories
* Identify primary programming languages
* Measure repository activity and consistency
* Generate AI-powered strengths assessment
* Generate AI-powered weaknesses assessment
* Generate AI-powered improvement suggestions
* Resume ↔ GitHub cross-check showing where the resume and public work agree or contradict
* Target job role — pick a tech role from a dropdown and get a role-fit score
  with the strengths and gaps for that role
* Resume improvement hints — shows what your GitHub proves that your resume
  is missing, so you can add it yourself and boost your chances
* Downloadable profile card — export the report as a shareable 2x PNG image
  (button-only, no inline preview)
* Responsive and minimal user interface
* Error handling for invalid usernames and API failures

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js
* Multer (file uploads)
* pdf-parse (PDF text extraction)
* jsonwebtoken (sessions)
* Mongoose + MongoDB Atlas (users & analysis history)

### APIs & Services

* GitHub REST API
* Groq API

---

## Project Structure

```txt
DevLens/
│
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── assets/
│   ├── components/
│   ├── package.json
│   └── vite.config.js
│
├── Backend/
│   ├── server.js
│   ├── github.js        # GitHub fetch, stat computation, cache, rate limits
│   ├── activity.js      # commit activity from the repositories commits API
│   ├── quality.js       # deterministic repository hygiene scoring
│   ├── analyses.js      # save / reuse / rate-limit fallback for analyses
│   ├── auth.js
│   ├── history.js
│   ├── db.js
│   ├── models/
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

### Frontend layout

```txt
Frontend/components/
├── Middle.jsx              # layout only — composes the sections below
├── MatchControls.jsx       # role dropdown + resume + match button
├── HistoryPanel.jsx        # snapshot table + trend chart
├── report/
│   ├── ProfileReport.jsx   # section order for a single analysis
│   ├── Panel.jsx           # shared Panel / ScoreMeter / BulletList
│   ├── ProfileHeader.jsx
│   ├── StatsStrip.jsx
│   ├── TechStack.jsx
│   ├── ActivityInsights.jsx
│   ├── ActivityHeatmap.jsx
│   ├── RepoQuality.jsx
│   ├── BulletColumns.jsx
│   ├── ResumeMatch.jsx
│   ├── RoleFit.jsx
│   ├── TopRepos.jsx
│   ├── ScoreTrend.jsx
│   └── ProfileCard.jsx
Frontend/src/
├── hooks/                  # useAnalysis (auto), useMatch, useHistory
└── lib/                    # api.js (all backend calls), auth, format, icons
```

---

## Installation

### Clone the Repository

```bash
git clone git@github.com:DibyanshuMoura/DevLens.git
```

### Navigate to the Project Directory

```bash
cd DevLens
```

### Install Frontend Dependencies

```bash
cd Frontend
npm install
```

### Install Backend Dependencies

```bash
cd ../Backend
npm install
```

---

## Environment Variables

### Backend

Create a `.env` file inside the Backend directory.

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=your_app
```

`GROQ_MODEL` is optional and defaults to `openai/gpt-oss-20b`.

### GitHub OAuth (optional)

Login enables the personal history & progress-comparison view. To set it up:

1. Create an OAuth App at https://github.com/settings/developers
2. Set the **Authorization callback URL** to `http://localhost:3000/auth/github/callback`
3. Fill in the credentials in `Backend/.env`:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
JWT_SECRET=any_long_random_string
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

Without these variables the app works normally — the sign-in button simply
returns a "not configured" notice.

---

## Database

MongoDB Atlas stores user accounts and analysis history:

* `users` — upserted on every OAuth login, keyed by GitHub's numeric id
  (stable even if the username changes)
* `snapshots` — one document per analysis, indexed by `{ login, createdAt }`,
  capped at the last 20 per user
* `analyses` — the full analysis payload, capped at the last 5 per user.
  This is what makes sign-in instant and what the rate-limit fallback serves.
  Role matches are never stored here — each one is computed fresh.

The backend refuses to start if it cannot connect to MongoDB, so put the
`MONGODB_URI` in `Backend/.env` before running.

### Frontend

Create a `.env` file inside the Frontend directory.

```env
VITE_API_URL=http://localhost:3000
```

---

## Run the Project

### Start Backend

```bash
cd Backend
npm start
```

### Start Frontend

```bash
cd Frontend
npm run dev
```

---

## Access the Application

Open your browser and visit:

```txt
http://localhost:5173
```

---

## Resume Upload

Optionally attach a resume PDF alongside the GitHub username. The backend
extracts the text from the PDF (in memory, nothing is stored on disk) and
includes it in the LLM prompt, so the generated strengths, weaknesses, and
improvements consider both the GitHub activity and the candidate's stated
skills, projects, and experience. The same text powers the job-role gap
detection in the Role Fit section.

* Only PDF files are accepted (max 5 MB)
* The upload is optional — the GitHub-only analysis still works without it

---

## Job Role Targeting

Before analyzing, the user picks a **target job role** from the dropdown
(Frontend Developer, ML Engineer, SRE, and 17 more). The analysis is then
evaluated against that role and the report gains a **Role Fit** section:

* a 0–100 match score for the selected role
* strengths the GitHub profile shows for the role
* "on GitHub but missing from your resume" hints — projects, skills and
  achievements that are publicly visible but absent from the uploaded resume

The user can then add those missing points to their own resume, increasing
their chances of being selected — with zero fabrication, since everything
suggested is backed by their public GitHub work.

---

## Analysis Workflow

Sign-in and analysis are one step. There is no "Analyze" button.

1. User signs in with GitHub (the signed-in account is the analysis target)
2. Frontend asks `GET /analysis` for the last saved analysis
3. If one exists and is under an hour old, it is rendered immediately —
   **no GitHub call, no LLM call**
4. Otherwise the frontend calls `POST /analyze`, which:
   - resolves the username from the verified JWT
   - fetches GitHub profile and repository data
   - computes commit activity and repository quality as verified signals
   - sends the profile to Groq for score, summary, skills, strengths,
     weaknesses and improvements
   - stores the result in `analyses` (for reuse and fallback) and appends a
     `snapshots` row (for progress history)
5. If GitHub's rate limit is hit and a saved analysis exists, the saved one is
   returned with `cached: true` and a notice, so the page is never empty

Role matching is a separate, cheap step:

6. User picks a target job role and optionally attaches a resume PDF
7. `POST /match` reads the **saved** analysis and asks Groq only for the
   `roleFit` block — **zero GitHub requests**, about 2 seconds
8. The result is returned and displayed directly under the controls. Nothing
   about a match is stored, so every run reflects the profile and resume as
   they are right now

---

## Verified Signals vs. AI Output

The report deliberately separates what the app *measured* from what the
model *wrote*:

| Section | Source |
| --- | --- |
| Commit Activity heatmap, streaks, peak day | Measured — GitHub Events API |
| Repository Quality score and checklists | Measured — GitHub repos payload |
| Stats strip, top repositories, languages | Measured — GitHub REST API |
| Summary, skills, strengths/weaknesses, role fit | Groq LLM |
| Resume cross-check, role gaps | Groq LLM (resume text + measured signals) |

The measured numbers are injected into the LLM prompt under a
`Verified Signals` heading with an instruction to treat them as ground
truth, which keeps the AI prose consistent with the charts above it. Both
measured sections are optional in the UI: if GitHub returns no activity the
heatmap simply does not render, and a failed activity fetch never fails the
analysis.

Note on limits: the Events API exposes roughly the last 90 days of *public*
activity, capped at the 300 most recent events. Private repositories are
never visible to GitHub's API, so the heatmap understates total work for
anyone with private repos — the UI labels this explicitly.

---

## Implementation Notes

The source carries no inline comments. The decisions that are easy to get
wrong are recorded here instead.

**Do not use the GitHub Events API for commit counts.** It looks like the
obvious source, but GitHub removed `payload.size` and `payload.commits` from
`PushEvent` — a push payload is now only `{ repository_id, push_id, ref,
head, before }`. An implementation built on it silently returns nothing.
Commit activity is read from `/repos/{owner}/{repo}/commits?author=…&since=…`
instead. (This was shipped broken once before this note existed.)

**Commit activity covers only part of a profile, by design.** A year of
commits costs one request per repository, against a 60/hour unauthenticated
limit, so only the 8 most recently pushed owned repositories are scanned
(`MAX_REPOS`), at most 3 pages each. Private repositories are never visible
to GitHub's API, so the totals understate the real work. The UI states this
coverage instead of implying the numbers are exhaustive.

**Rate limiting is handled by aborting, not by retrying.** If GitHub's quota
runs out mid-scan, the scan stops immediately (`RateLimitedError`) rather
than firing doomed requests at the remaining repositories. Partial data is
still returned, flagged `truncated`.

**Caches exist because the quota is tiny.** Profile/repos responses are
cached for 5 minutes and commit activity for 10. A cold load costs roughly
18 requests; without the caches, a few page loads exhaust the hourly budget.

**Analyses are saved, role matches are not.** A stored analysis is what makes
sign-in instant and what the rate-limit fallback serves. A role match is
always recomputed, so nothing about it is persisted and it disappears on
reload.

**Prompt hardening is deliberate.** The LLM prompt carries explicit
`STRICT RULES` (JSON only, no markdown, no backticks) because the model
otherwise wraps answers in prose. Responses are parsed leniently (fences and
stray text are stripped) and the Groq call retries with a stricter-to-looser
model sequence, since `gpt-oss` models intermittently fail JSON-mode
validation.

**OAuth tokens do not need refreshing.** The app uses a GitHub OAuth App,
whose tokens are long-lived and do not expire unless the user revokes them.
GitHub *Apps* are the ones with 8-hour expiry and refresh tokens.

## Example Data Analyzed

* Username
* Public repositories
* Followers
* Repository stars
* Programming languages
* Active repositories
* Profile activity patterns
* Repository distribution

---

## Screenshots

### Homepage

<img width="100%" alt="Homepage" src="./Screenshots/Homepage.png">

### Analysis Report

<img width="100%" alt="Analysis Report" src="./Screenshots/Analysis.png">

### Mobile View

<img width="40%" alt="Mobile View" src="./Screenshots/Mobile.png">

---

## Future Improvements

* Skill scoring system
* Developer maturity score
* Resume readiness analysis
* Advanced analytics dashboard
* Export analysis as PDF
* Compare against other developers' profiles

---

## Learning Outcomes

This project helped in understanding:

* React component architecture
* State management with Hooks
* Environment variable management
* REST API integration
* Backend development with Express.js
* Error handling and validation
* LLM API integration
* GitHub API usage
* Frontend and backend separation
* Deployment workflows

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss the proposed improvements.

---

## License

This project is licensed under the MIT License.

---

## Author

**Dibyanshu Moura**

* GitHub: https://github.com/DibyanshuMoura
* X: https://x.com/DibyanshuMoura

## Repository

**Github Repository**

* https://github.com/DibyanshuMoura/DevLens