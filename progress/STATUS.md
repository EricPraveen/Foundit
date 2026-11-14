# Project status

**Current phase:** Phase 1 — Backend Implementation (Slice 3: Found Reporting & Handover / BACKEND-04)

**Overall:** Found Item reporting, image storage abstraction, Security Officer physical handover confirmation, audit trail, and public discovery APIs fully implemented and verified with automated integration tests.

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
- [x] Principal-derived profile management (`GET /api/v1/users/me`, `PUT /api/v1/users/me`) with unverified Index Number isolation
- [x] Central Security Office configuration (`GET /api/v1/security-office`, `PUT /api/v1/admin/security-office`) and officer provisioning (`POST /api/v1/admin/officers`, `GET /api/v1/admin/officers`)
- [x] Category reference data (`GET /api/v1/categories`, Super Admin CRUD & toggle under `/api/v1/admin/categories`) with soft deactivation
- [x] Campus locations reference data (`GET /api/v1/locations`, Super Admin CRUD & toggle under `/api/v1/admin/locations`) with soft deactivation
- [x] Flyway migration `V3__create_profiles_office_categories_locations.sql` created with safe initial seeds
- [x] Found Item reporting lifecycle with initial `PENDING_HANDOVER` status (`POST /api/v1/found-items`)
- [x] Public browse endpoint (`GET /api/v1/found-items`) strictly filtering to verified `AVAILABLE` items with finder privacy masking
- [x] Security Officer physical handover confirmation (`POST /api/v1/officer/found-items/{id}/confirm-handover`) with office assignment validation and status transition to `AVAILABLE`
- [x] Immutable handover audit trail logging (`found_item_handover_logs`)
- [x] Image attachment handling with Supabase Storage / Local storage abstraction and validation
- [x] Overdue pending handover query (>24h) support (`GET /api/v1/officer/found-items/overdue-handover`)
- [x] Flyway migration `V4__create_found_items_and_handover_tables.sql` created
- [x] Comprehensive automated test suite expanded (56 tests passing)
- [x] Complete CI pipeline with GitHub Actions (Backend Java 21, Frontend deferred check, Code Quality, GitGuardian ggshield, Dependabot)

## In progress
- [ ] Phase 1 — Slice 4: Private Lost Report Lifecycle (Issue #94: BACKEND-05)

## Evidence log
| Date | Change/evidence | Notes |
|---|---|---|
| 2026-11-14 | Initial starter scaffold assembled from referenced conversation | No code or tests claimed |
| 2026-11-14 | BACKEND-01 (`backend/backend-01-foundation`): Spring Boot 3.3.5, Java 21, Flyway baseline, Actuator, OpenAPI, GlobalExceptionHandler | Verified via `cd backend && ./mvnw clean test` (6 tests executed, 0 failures, 0 errors, build success) |
| 2026-11-14 | BACKEND-02 (`backend/backend-02-auth-security`): @uom.lk registration, email verification, JWT login, RBAC, V2 migration | Verified via `cd backend && ./mvnw clean verify` (21 tests executed, 0 failures, 0 errors, build success) |
| 2026-11-14 | BACKEND-03 (`backend/backend-03-profiles-reference-data`): User profiles, central Security Office, officer provisioning, categories, locations, V3 migration | Verified via `cd backend && ./mvnw clean verify` (40 tests executed, 0 failures, 0 errors, build success in 7.7s) |
| 2026-11-15 | CI/CD Automation (`feature/ci-cd-pipeline`): GitHub Actions (`ci.yml`, `secret-scanning.yml`), Dependabot, GitGuardian ggshield, PR template, CI docs | Verified via YAML parsing & `cd backend && ./mvnw clean verify` (40 tests passing, build success in 8.1s) |
| 2026-11-15 | BACKEND-04 (`feature/backend-04-found-reporting`): Found item reporting, officer handover, images, audit trail, V4 migration | Verified via `cd backend && ./mvnw clean verify` (56 tests executed, 0 failures, 0 errors, build success in 10.8s) |

Update this file with concrete commands/results or review evidence whenever a task is marked complete.
