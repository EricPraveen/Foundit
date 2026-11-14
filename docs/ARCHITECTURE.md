# Architecture outline

## Repository

Single Git repository; independently organized `backend/`, `frontend/`, and `docs/`. Backend development is the active first phase.

## Backend style

Use feature-oriented packages with conventional layers per feature: controller, service, repository, entity, DTO, mapper, and enum where appropriate. Keep cross-cutting concerns in `common/` (configuration, errors, security, validation, audit). Prefer DTOs over returning persistence entities. Use Flyway migrations as schema authority.

## Initial domain concepts (not a finalized schema)

User, StudentProfile, SecurityProfile, Category, Location, LostReport, FoundItem, ItemImage, Claim, ClaimEvidence, PointTransaction, Notification, AuditLog, ItemStatusHistory, EmailVerification, and optional refresh-token/system-settings records. Finalize relationships and constraints in `docs/DATABASE.md` before migrations beyond the baseline.

## Key boundaries

- `lost_reports` and `found_items` are separate aggregates and do not require each other.
- A found item records finder and officer receipt/verification.
- Claims are many per found item; sensitive evidence is separately protected.
- Points are ledger transactions and must be idempotent.
- Notification delivery and file storage should be behind interfaces to allow provider decisions later.
- State changes that affect custody, claims, points, or unclaimed escalation should be auditable.

## Frontend later

Feature folders for auth, dashboard, lost-items, found-items, claims, reputation, notifications, student management, security management, and admin. Use role-specific layouts and typed API services generated or aligned from the stable OpenAPI contract.
