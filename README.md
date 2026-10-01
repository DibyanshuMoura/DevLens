# DevLens

DevLens is an AI-powered GitHub profile analysis platform that evaluates public GitHub accounts using repository metadata, activity patterns, and GitHub statistics. The application combines GitHub API data with LLM-generated insights to provide strengths, weaknesses, and actionable improvement suggestions for developers.

---

## Features

One-click analysis of your own GitHub profile after signing in (no username typing)
* Upload a resume (PDF) to enrich the AI analysis with skills, projects, and experience from the resume
* GitHub OAuth sign-in with analysis history
* Progress tracking — compare score, repos, and stars against your previous analyses
* Fetch real-time GitHub data using the GitHub API
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
* Downloadable profile card — export the report as a shareable 2x PNG image
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
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
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
skills, projects, and experience.

* Only PDF files are accepted (max 5 MB)
* The upload is optional — the GitHub-only analysis still works without it

---

## Analysis Workflow

1. User signs in with GitHub (the signed-in account is the analysis target)
2. (Optional) User attaches a resume PDF — the backend extracts its text
3. Frontend sends a request to the backend with the session token
4. Backend resolves the GitHub username from the verified JWT
5. GitHub profile and repository data are fetched and processed
6. GitHub data (and resume text, if provided) is sent to Groq's LLM for evaluation
7. AI generates score, summary, tech stack, activity insights, strengths,
   weaknesses, improvements, and resume match
8. Results are returned and displayed as a full-width report
9. A snapshot is stored in MongoDB for progress comparison

---

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

* GitHub contribution graph analysis
* Skill scoring system
* Developer maturity score
* Repository quality assessment
* Resume readiness analysis
* Advanced analytics dashboard
* Export analysis as PDF
* Historical profile tracking
* Authentication and saved reports

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