# Project status

**Current phase:** Phase 1 — Backend Implementation (Slice 1: Identity and Access / BACKEND-02)

**Overall:** University registration, email verification, login with JWT, and role-based access control (RBAC) fully implemented and verified with automated integration tests.

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
- [x] University account registration restricted to exact `@uom.lk` domain (normalization, subdomain/lookalike rejection)
- [x] BCrypt secure password hashing and protection against credential leakage
- [x] Single-use expiring email verification workflow with SHA-256 hashed token storage
- [x] Login workflow with email verification gate, account status check, and signed JWT issuance
- [x] Stateless Spring Security filter chain with Bearer token authentication and method security
- [x] Role-Based Access Control (RBAC) for `STUDENT`, `SECURITY_OFFICER`, and `SUPER_ADMIN`
- [x] Flyway migration `V2__create_users_and_auth_tables.sql` created
- [x] Comprehensive automated test suite (21 tests passing)

## In progress
- [ ] Phase 1 — Slice 2: Core Records & Profiles (Issue #92: User profiles, Security Office, categories, locations)

## Evidence log
| Date | Change/evidence | Notes |
|---|---|---|
| 2026-11-14 | Initial starter scaffold assembled from referenced conversation | No code or tests claimed |
| 2026-11-14 | BACKEND-01 (`backend/backend-01-foundation`): Spring Boot 3.3.5, Java 21, Flyway baseline, Actuator, OpenAPI, GlobalExceptionHandler | Verified via `cd backend && ./mvnw clean test` (6 tests executed, 0 failures, 0 errors, build success) |
| 2026-11-14 | BACKEND-02 (`backend/backend-02-auth-security`): @uom.lk registration, email verification, JWT login, RBAC, V2 migration | Verified via `cd backend && ./mvnw clean verify` (21 tests executed, 0 failures, 0 errors, build success) |

Update this file with concrete commands/results or review evidence whenever a task is marked complete.
