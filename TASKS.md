# CampusFind implementation tracker

Check an item only when implemented and supported by evidence. Record evidence and date in `progress/STATUS.md`.

## Phase 0 — Foundation and decisions
- [x] Confirm open decisions needed for first backend slice
- [x] Select exact Spring Boot/Maven dependency versions (Java 21, Spring Boot 3.3.5)
- [x] Create backend application and local development configuration (.env.example, application.yml)
- [x] Establish PostgreSQL and Flyway baseline (V1__init_foundation.sql, ddl-auto=validate)
- [x] Add health endpoint, global error format, and OpenAPI (/actuator/health, GlobalExceptionHandler, /v3/api-docs)
- [x] Agree initial ER model and migration conventions (Flyway migrations V1 through V9 verified)

## Phase 1 — Backend implementation (frontend remains deferred)
### Identity and access
- [x] Student registration restricted to `@uom.lk`
- [x] Email verification link and account activation
- [x] Login with JWT and unverified user restriction
- [x] Roles: STUDENT, SECURITY_OFFICER, SUPER_ADMIN
- [x] Authorization and sensitive-data access tests
- [ ] Decide Index Number validation source/process

### Core records
- [x] User and student/security profiles
- [x] Categories and campus locations
- [x] Separate lost reports and found reports
- [x] Image/evidence storage abstraction with access controls
- [x] Audit trail and status history

### Lost/found workflows
- [x] Student creates and manages own lost report
- [x] Lost report visible only to Security Officers and its owner as appropriate (owner access details to confirm)
- [x] Student creates found report before handover; no officer-created-for-student report in MVP
- [x] 24-hour handover reminders without a fixed handover deadline
- [x] Officer confirms physical receipt and verification
- [x] Only verified received found items become student-visible

### Claims and return
- [x] Students browse available found items
- [x] Claim requires Student ID, Index Number, and ownership proof
- [x] Multiple claims supported; officer decides rightful owner
- [x] Rejected claim may be resubmitted with new evidence
- [x] Approval/reservation/physical collection/return lifecycle (Approval, reservation, physical collection confirmation, item return, and lost report recovery implemented in BACKEND-07)
- [x] Sensitive evidence visible only to Security Officers

### Points, notifications, administration
- [x] Category-configurable point rules; award after verified handover (Implemented in BACKEND-07 via category_reputation_rules and ReputationService)
- [x] Prevent duplicate awards; maintain point ledger (Append-only reputation_transactions ledger with unique idempotency keys)
- [x] In-app/mobile-first notifications and email for important events (Implemented in BACKEND-08 via notifications table, EmailService, and decoupled domain events)
- [x] One central Security Office with multiple officers
- [x] Unclaimed reminder, UNCLAIMED status, and Super Admin escalation (Implemented in BACKEND-08 via ReminderSchedulerService, handover_reminder_logs, and unclaimed_escalation_logs)
- [x] Final handling follows university policy; no automatic disposal (Enforced: UNCLAIMED status triggers escalation without deletion, disposal, or transfer)
- [x] Admin management and audit functions (Implemented in BACKEND-09 via user governance, reputation rules, system config, and immutable audit logs)

## Phase 2 — Backend completion gate
- [x] Unit, integration, API, auth, authorization, validation, and workflow tests (155 tests passing, 0 failures, 0 errors)
- [x] Clean database migration path verified (Flyway V1 through V9 verified)
- [x] OpenAPI contract complete and stable (/v3/api-docs and docs/API/* updated)
- [x] Sensitive data privacy review completed (Strict Anti-IDOR, role boundaries, sensitive payload sanitization)
- [x] Core end-to-end backend workflows pass (Journeys A through G verified via BackendVerificationGateIntegrationTest)
- [x] Update `progress/STATUS.md` with evidence and mark backend gate complete (docs/BACKEND_COMPLETION_REPORT.md created)

## Phase 3 — Frontend (start only after Phase 2)
- [x] React application foundation, routing, centralized API client, and UI system (FRONTEND-01)
- [x] Authentication and role-specific layouts (FRONTEND-02)
- [x] Student dashboard, student profile, categories, and campus locations views (FRONTEND-03)
- [x] Found item reporting and public browsing (FRONTEND-04)
- [ ] Claims and notifications (FRONTEND-05)
- [ ] Security Officer dashboards and review flows (FRONTEND-06)
- [ ] Super Admin management screens (FRONTEND-07)
- [ ] Responsive and accessible UI Polish & Verification (FRONTEND-08)
- [ ] PWA/push support if confirmed in scope

## Phase 4 — Integration and release
- [ ] Frontend-backend integration and end-to-end scenarios
- [ ] Production configuration, deployment target, monitoring, backups
- [ ] Release checklist and operational documentation
