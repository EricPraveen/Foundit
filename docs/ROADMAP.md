# Delivery roadmap and backend completion gate

## Phase 0 — Foundation

Confirm implementation-blocking decisions, create Spring Boot project, local PostgreSQL setup, migration baseline, configuration examples, health endpoint, error handling, and OpenAPI setup.

## Phase 1 — Backend, in slices

1. Identity and roles: registration, `@uom.lk` email verification, login, password recovery, authorization.
2. Profiles and reference data: users, profiles, categories, locations, central office/officers.
3. Reporting: separate lost and found records, validation, images, ownership rules.
4. Physical custody: reminders, officer receipt, verification, student-facing availability.
5. Claims and return: private evidence, multi-claim review, rejection/resubmission, reservation, collection confirmation.
6. Reputation and notifications: category rules, ledger/idempotency, in-app and email; push only if selected.
7. Unclaimed and administration: configurable timer, officer reminder, UNCLAIMED status, Super Admin escalation, audit.

Each slice includes migrations, API docs, authorization checks, and tests before moving on.

## Phase 2 — Backend verification and completion gate

Frontend work starts only after all are true:

- All required backend use cases and state transitions are implemented.
- Role and ownership checks prevent unauthorized access, including to lost reports and claim evidence.
- Migrations build a clean database reliably.
- Unit, integration, API, validation, security, and workflow tests pass.
- Critical full workflows pass: found → handover → points; lost → claim → officer decision → collection; unclaimed → escalation.
- OpenAPI documentation matches the implemented API and is stable enough to consume.
- Configuration and secrets handling are documented; no critical backend defects remain.
- Completion evidence is recorded in `progress/STATUS.md` and `TASKS.md`.

## Phase 3 — Frontend

Build React screens against the stable OpenAPI contract: authentication, student flows, Security Officer flows, then Super Admin. Include responsive/accessibility states and API loading/error handling. PWA/push scope remains subject to confirmation.

## Phase 4 — Integration and release

Run end-to-end journeys across real backend and frontend, verify role-specific navigation/privacy, then implement the selected deployment and operations plan.
