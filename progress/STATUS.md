# Project status

**Current phase:** Phase 1 — Backend Implementation (Slice 7: In-App and Email Notifications, Reminders, and Unclaimed Escalation / BACKEND-08)

**Overall:** In-app notification system (`notifications`), email provider abstraction (`EmailService`, `MockEmailService`) with isolated retry logs (`notification_email_deliveries`), transactional domain event decoupled listeners (`AFTER_COMMIT`), automated 24-hour pending handover reminders with cycle deduplication (`handover_reminder_logs`), and configurable unclaimed item escalation to Security Officers and Super Admins (`unclaimed_escalation_logs`) without automatic disposal fully implemented and verified with automated integration tests (127 total tests passing).

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
- [x] Complete CI pipeline with GitHub Actions (Backend Java 21, Frontend deferred check, Code Quality, GitGuardian ggshield, Dependabot)
- [x] Private Lost Report lifecycle with initial `ACTIVE` status (`POST /api/v1/lost-reports`)
- [x] Strict student privacy isolation: only report owner can view/update/cancel/resolve; cross-student lookup returns `404 Not Found` (anti-enumeration & anti-IDOR)
- [x] Security Officer search within designated security office scope (`GET /api/v1/officer/lost-reports`); cross-office access returns `403 Forbidden`
- [x] Lost report terminal transitions to `RESOLVED` and `CANCELLED` with audit logging and conflict protection
- [x] Immutable lifecycle audit logging table (`lost_report_audit_logs`) tracking actor role, transition, details, and timestamps
- [x] Image attachments for lost reports using shared `StorageService` abstraction
- [x] Complete isolation from public browse APIs (lost reports never exposed in public found item endpoints)
- [x] Flyway migration `V5__create_lost_reports_and_audit_tables.sql` created
- [x] Student claim submission with mandatory Index Number, Student ID card, and ownership proof files (`POST /api/v1/found-items/{itemId}/claims`)
- [x] Private claim evidence handling and secure authenticated download endpoint (`GET /api/v1/claims/{claimId}/evidence/{evidenceId}`); zero public exposure in item DTOs or public storage
- [x] Anti-IDOR protections: students can only access their own claims and evidence (404 on cross-student requests)
- [x] Security Officer claim review and office scope boundaries (`GET /api/v1/officer/claims`, `GET /api/v1/officer/claims/{claimId}`)
- [x] Concurrency-safe claim approval (`POST /api/v1/officer/claims/{claimId}/approve`) using pessimistic write locking and partial unique database index (`uq_found_item_approved_claim`) reserving item (`CLAIM_PENDING`)
- [x] Multiple pending claims coexistence: approving one claim preserves remaining pending claims in `PENDING` state for audit and fallback
- [x] Claim rejection with mandatory reason (`POST /api/v1/officer/claims/{claimId}/reject`) and support for claimant resubmission with updated evidence
- [x] Flyway migration `V6__create_claims_and_evidence_tables.sql` created
- [x] Physical collection confirmation by Security Officers (`POST /api/v1/officer/claims/{claimId}/confirm-collection`) with claim completion (`COMPLETED`), item return (`RETURNED`), and linked lost report transition (`RECOVERED`)
- [x] Immutable physical collection audit log (`item_collection_logs`) with unique constraints on claim and item preventing double collection
- [x] Append-only reputation ledger (`reputation_transactions`) with transaction types (`FOUND_ITEM_HANDOVER`, `ITEM_COLLECTION`) and unique idempotency keys preventing duplicate rewards
- [x] Configurable category-based reputation rules (`category_reputation_rules` table and `application.yml` properties)
- [x] Principal-derived reputation endpoints (`GET /api/v1/users/me/reputation`, `GET /api/v1/users/me/reputation/transactions`) preventing IDOR
- [x] Automatic finder reward awarding upon verified physical handover in `FoundItemService.confirmHandover`
- [x] Flyway migration `V7__create_collection_and_reputation_tables.sql` created
- [x] Automated test suite expanded to 113 passing tests (16 new integration tests for collection, lost report recovery, reputation balance, ledger history, and idempotency)
- [x] Persistent in-app notifications system (`notifications` table) with unread count and read tracking (`GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, `PATCH /api/v1/notifications/{id}/read`, `PATCH /api/v1/notifications/read-all`)
- [x] Decoupled transactional domain event listeners using `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` for reporting, handovers, claims, and collections
- [x] Email notification abstraction (`EmailService`, `MockEmailService`) with isolated retry logs (`notification_email_deliveries`) preventing business rollbacks on dispatch failures
- [x] Idempotent 24-hour pending handover reminders (`handover_reminder_logs`) with cycle-based deduplication
- [x] Unclaimed item monitoring and escalation (`unclaimed_escalation_logs`) transitioning items past threshold to `UNCLAIMED` without automatic disposal (disabled by default via `app.notification.unclaimed-enabled=false`)
- [x] Flyway migration `V8__create_notifications_reminders_and_escalations.sql` created
- [x] Automated test suite expanded to 127 passing tests (14 new integration tests for notifications, unread count, anti-IDOR, handover reminders, unclaimed escalation, email retries, and domain events)

## In progress
- [ ] Phase 1 — Slice 8: Administration & Audit

## Evidence log
| Date | Change/evidence | Notes |
|---|---|---|
| 2026-11-14 | Initial starter scaffold assembled from referenced conversation | No code or tests claimed |
| 2026-11-14 | BACKEND-01 (`backend/backend-01-foundation`): Spring Boot 3.3.5, Java 21, Flyway baseline, Actuator, OpenAPI, GlobalExceptionHandler | Verified via `cd backend && ./mvnw clean test` (6 tests executed, 0 failures, 0 errors, build success) |
| 2026-11-14 | BACKEND-02 (`backend/backend-02-auth-security`): @uom.lk registration, email verification, JWT login, RBAC, V2 migration | Verified via `cd backend && ./mvnw clean verify` (21 tests executed, 0 failures, 0 errors, build success) |
| 2026-11-14 | BACKEND-03 (`backend/backend-03-profiles-reference-data`): User profiles, central Security Office, officer provisioning, categories, locations, V3 migration | Verified via `cd backend && ./mvnw clean verify` (40 tests executed, 0 failures, 0 errors, build success in 7.7s) |
| 2026-11-15 | CI/CD Automation (`feature/ci-cd-pipeline`): GitHub Actions (`ci.yml`, `secret-scanning.yml`), Dependabot, GitGuardian ggshield, PR template, CI docs | Verified via YAML parsing & `cd backend && ./mvnw clean verify` (40 tests passing, build success in 8.1s) |
| 2026-11-15 | BACKEND-04 (`feature/backend-04-found-reporting`): Found item reporting, officer handover, images, audit trail, V4 migration | Verified via `cd backend && ./mvnw clean verify` (56 tests executed, 0 failures, 0 errors, build success in 10.8s) |
| 2026-11-15 | BACKEND-05 (`feature/backend-05-private-lost-reports`): Private lost report lifecycle, owner isolation, officer scope, audit logs, V5 migration | Verified via `cd backend && ./mvnw clean verify` (81 tests executed, 0 failures, 0 errors, build success in 17.4s) |
| 2026-11-15 | BACKEND-06 (`backend/backend-06-claims-review`): Claims, private evidence, officer review, single-approval concurrency, V6 migration | Verified via `cd backend && ./mvnw clean verify` (97 tests executed, 0 failures, 0 errors, build success in 25.1s) |
| 2026-11-15 | BACKEND-07 (`backend/backend-07-collection-reputation`): Physical collection, return status, linked lost report recovery, reputation ledger, V7 migration | Verified via `cd backend && ./mvnw clean verify` (113 tests executed, 0 failures, 0 errors, build success in 27.5s) |
| 2026-11-15 | BACKEND-08 (`backend/backend-08-notifications-escalation`): In-app notifications, email retry logs, 24h handover reminders, unclaimed escalation, V8 migration | Verified via `cd backend && ./mvnw test` (127 tests executed, 0 failures, 0 errors, build success in 30.0s) |

Update this file with concrete commands/results or review evidence whenever a task is marked complete.
