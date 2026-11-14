# Foundit

Foundit is a university lost-and-found system for students, Security Officers, and Super Admins. This repository is a **modular monolith** with the Java 21 / Spring Boot backend foundation initialized under `backend/`. The React frontend remains deferred until the backend completion gate in `docs/ROADMAP.md` is met.

## Quick start (Backend)

```bash
cd backend
./mvnw clean test
```
See [backend/README.md](file:///Users/ericpraveen/Desktop/Foundit/backend/README.md) for full setup, environment variables, Actuator, and OpenAPI documentation.

## Development rule

Build and complete the Spring Boot backend first. Finish its business workflows, security, database migrations, tests, and OpenAPI contract. Start the React frontend only after the backend completion gate in `docs/ROADMAP.md` is met.

## Stack agreed so far

- Backend: Java 21, Spring Boot, Maven, Spring Data JPA, Spring Security, PostgreSQL, Flyway, OpenAPI.
- Frontend (later): React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form, Zod. PWA is a later enhancement.
- Repository: monorepo.

Exact framework/library versions should be selected and recorded when implementation begins; do not assume versions from this brief.

## Start here

1. Read `AGENTS.md` and `docs/PROJECT_CONTEXT.md`.
2. Review `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, and `docs/ROADMAP.md`.
3. Update `TASKS.md` as work is completed.
4. Implement only the current phase. Keep frontend scaffolding inert until the backend gate is met.

## Repository map

- `backend/` Spring Boot application scaffold
- `frontend/` reserved React app structure
- `docs/` requirements, architecture, data, API, and delivery notes
- `TASKS.md` phase-based checklist
- `progress/` brief status log

See `docs/USING_THIS_STARTER.md` for setup guidance.
