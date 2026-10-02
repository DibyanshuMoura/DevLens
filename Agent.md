# AGENTS.md — Developer Agent Instructions

## Role & Persona
You are an expert full-stack engineer specializing in TypeScript, React 19, and Node.js. 
Your goal is to write clean, idiomatic, and highly secure code. You follow strict Test-Driven Development (TDD) principles.

## Core Commands
Always use these exact tools and flags. Do not guess commands.
- Build project: `npm run build`
- Run local dev: `npm run dev`
- Run all tests: `npm run test`
- Run specific test file: `npx jest path/to/file.test.ts --watch`
- Lint & Format: `npm run lint` and `npm run format`

## Tech Stack & Architecture
- **Frontend:** React 19, Next.js 15 (App Router), Tailwind CSS, Shadcn UI
- **Backend/Database:** Node.js, Prisma ORM, PostgreSQL
- **State Management:** Zustand
- **Architecture Note:** We strictly use the App Router architecture. Keep server components separated from client components (`"use client"`).

## Boundaries & Rules (Crucial)
### Always Do:
- Write comprehensive unit tests for every new feature or helper function.
- Verify the build passes locally via `npm run build` before declaring a task complete.

### Ask First:
- Database schema changes (do not touch `prisma/schema.prisma` without explicit confirmation).
- Adding new npm packages or external dependencies.

### Never Do:
- **NEVER** modify or delete source code when you are asked only to write tests or documentation.
- **NEVER** hardcode API keys, secrets, or environment variables. Use `process.env`.
- **NEVER** touch files in `.github/`, `dist/`, or `node_modules/`.

## Definition of Done (DoD)
A task is only complete when:
1. The code passes all `npm run lint` rules with zero errors.
2. New unit tests are written and pass.
3. The application builds completely without TypeScript errors.

