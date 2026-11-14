# Project status

**Current phase:** Phase 0 — Foundation / Database Infrastructure (BACKEND-01)

**Overall:** Backend foundation initialized with Java 21, Spring Boot 3.3.5, PostgreSQL configuration, Flyway migrations, Actuator health, OpenAPI documentation, and automated tests.

## Completed
- [x] Project context and confirmed decisions captured
- [x] Backend-first roadmap and completion gate documented
- [x] Monorepo folder scaffold created
- [x] Java 21 / Spring Boot 3.3.5 / Maven backend foundation established under `backend/`
- [x] PostgreSQL connection properties configured via environment variables (`.env.example`)
- [x] Flyway initial baseline migration `V1__init_foundation.sql` created and `hibernate.ddl-auto=validate` enforced
- [x] Spring Boot Actuator `/actuator/health` configured and tested
- [x] SpringDoc OpenAPI 3.0 / Swagger UI metadata configured and tested
- [x] Global exception handling and structured error responses implemented and tested
- [x] Maven build and test suite verified (6 tests passing)

## In progress
- [ ] Phase 1 — Identity and access (Issue #91: Student registration and authentication)

## Evidence log
| Date | Change/evidence | Notes |
|---|---|---|
| 2026-11-14 | Initial starter scaffold assembled from referenced conversation | No code or tests claimed |
| 2026-11-14 | BACKEND-01 (`backend/backend-01-foundation`): Spring Boot 3.3.5, Java 21, Flyway baseline, Actuator, OpenAPI, GlobalExceptionHandler | Verified via `cd backend && ./mvnw clean test` (6 tests executed, 0 failures, 0 errors, build success) |

Update this file with concrete commands/results or review evidence whenever a task is marked complete.
