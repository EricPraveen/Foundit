# Architecture Refactoring Report — ISS-02 and ISS-03

**Project:** CampusFind (Foundit)  
**Refactoring Target:** Architecture Review Medium Issues (ISS-02, ISS-03)  
**Branch:** `refactor/iss-02-iss-03-architecture-cleanup`  
**Date:** 2026-11-15  

---

## 1. Executive Summary

This report documents the resolution of two medium-severity architectural coupling issues identified in the CampusFind backend architectural review:
- **ISS-02: Inverted Domain Event Dependency** (producers depending on consumer package).
- **ISS-03: Service Bypass in Cross-Feature State Transitions** (`CollectionService` directly mutating `LostReportEntity` and writing to `LostReportAuditLogRepository`).

Both refactorings preserve all existing HTTP endpoints, API contracts, security rules, transaction boundaries, and business workflows without requiring schema migrations or breaking changes.

---

## 2. ISS-02: Inverted Domain Event Dependency

### 2.1 Problem Description
Previously, core business features (`item`, `claim`, `collection`) published domain events that were declared inside the notification feature package (`com.campusfind.features.notification.event.*`). This inverted clean dependency rules: business domain producers depended directly on a downstream consumer feature package.

### 2.2 Resolution & Package Changes
1. **Relocated Event Definitions:**
   The 6 domain events were moved out of `com.campusfind.features.notification.event` into a neutral shared event package:
   `com.campusfind.common.event`
   - `FoundItemReportedEvent`
   - `FoundItemHandoverConfirmedEvent`
   - `ClaimSubmittedEvent`
   - `ClaimApprovedEvent`
   - `ClaimRejectedEvent`
   - `CollectionConfirmedEvent`
2. **Updated Event Publishers:**
   `FoundItemService`, `ClaimService`, and `CollectionService` now import events exclusively from `com.campusfind.common.event.*`.
3. **Relocated Event Listener:**
   `NotificationEventListener` was relocated from `features.notification.event` to `com.campusfind.features.notification.listener`, where it consumes events from `com.campusfind.common.event.*`.
4. **Eliminated Legacy Package:**
   The legacy package `com.campusfind.features.notification.event` was completely removed. Zero references remain in the repository.

### 2.3 Dependency Direction Comparison

**Before (Inverted):**
```
features.item -----\
features.claim -----> [features.notification.event] (Producer couples to Consumer)
features.collection /
```

**After (Clean):**
```
features.item -------\
features.claim -------> [common.event] <------- features.notification.listener
features.collection -/  (Shared Domain Events)  (Consumer Listener)
```

---

## 3. ISS-03: Cross-Feature Service Bypass

### 3.1 Problem Description
During physical collection confirmation, `CollectionService` directly queried `lostReportRepository`, mutated `lostReport.setStatus(LostReportStatus.RECOVERED)`, and directly instantiated and saved `LostReportAuditLogEntity` via `lostReportAuditLogRepository`. This bypassed `LostReportService`, scattering lost report business rules and audit persistence outside of its owning feature.

### 3.2 Resolution & Service Delegation Design
1. **New Service Operation in `LostReportService`:**
   Added method:
   ```java
   @Transactional
   public LostReportEntity resolveFromCollection(UUID lostReportId, UserEntity claimant, UserEntity officer, UUID claimId)
   ```
   This operation:
   - Validates caller authorization (officer or super admin required; students rejected with `403 Forbidden`).
   - Retrieves and validates the linked Lost Report (returns `400 Bad Request` if not found).
   - Validates claimant ownership against the report owner (`400 Bad Request` if mismatched).
   - Validates that the report is in `ACTIVE` status (`409 Conflict` if already in terminal state).
   - Transitions report to `RECOVERED` with `resolvedAt` and `resolvedBy(officer)`.
   - Records the immutable `LostReportAuditLogEntity` (`"RECOVERED_VIA_COLLECTION"`) and centralized audit record (`"RECOVER_LOST_REPORT_VIA_COLLECTION"`).
   - Returns the updated `LostReportEntity`.
2. **Refactored `CollectionService`:**
   - Removed direct repository dependencies: `LostReportRepository` and `LostReportAuditLogRepository` were completely removed from `CollectionService`.
   - Injected `LostReportService`.
   - `CollectionService.confirmCollection` delegates recovery via:
     ```java
     if (linkedLostReportId != null) {
         resolvedLostReport = lostReportService.resolveFromCollection(
                 linkedLostReportId, claim.getClaimant(), officer, claimId);
     }
     ```

### 3.3 Transaction Consistency Considerations
- Both `CollectionService.confirmCollection` and `LostReportService.resolveFromCollection` use standard Spring `@Transactional` with default propagation (`Propagation.REQUIRED`).
- They execute within the **same atomic database transaction**.
- If any operation fails (e.g. invalid claim state, lost report ownership mismatch, or collection log conflict), all mutations across Claim, Found Item, Lost Report, and Audit Log roll back atomically.
- No `REQUIRES_NEW` propagation was introduced for business logic.

---

## 4. Summary of Files Changed

| Category | File | Change Description |
|---|---|---|
| **Events** | `common/event/ClaimApprovedEvent.java` | Created in shared package |
| **Events** | `common/event/ClaimRejectedEvent.java` | Created in shared package |
| **Events** | `common/event/ClaimSubmittedEvent.java` | Created in shared package |
| **Events** | `common/event/CollectionConfirmedEvent.java` | Created in shared package |
| **Events** | `common/event/FoundItemHandoverConfirmedEvent.java` | Created in shared package |
| **Events** | `common/event/FoundItemReportedEvent.java` | Created in shared package |
| **Listener** | `features/notification/listener/NotificationEventListener.java` | Moved from `event/` to `listener/` |
| **Publishers** | `features/item/FoundItemService.java` | Updated event imports to `common.event` |
| **Publishers** | `features/claim/ClaimService.java` | Updated event imports to `common.event` |
| **Publishers** | `features/collection/CollectionService.java` | Updated event imports, replaced lost report repositories with `LostReportService` |
| **Service** | `features/lostreport/LostReportService.java` | Added `resolveFromCollection(...)` encapsulation |
| **Tests** | `features/workflow/ArchitectureRefactoringIntegrationTest.java` | Added 4 automated verification tests |
| **Removed** | `features/notification/event/*` | Removed legacy package directory |

---

## 5. Test Execution Evidence

All 159 tests passed cleanly with 0 failures, 0 errors, and 0 skipped.

### New Architecture Verification Tests
`ArchitectureRefactoringIntegrationTest`:
1. `testNoImportsFromLegacyNotificationEventPackage`: Scans all source files under `src/main/java` and verifies zero imports from `com.campusfind.features.notification.event`.
2. `testLostReportService_ResolveFromCollection_Success`: Verifies `LostReportService.resolveFromCollection` sets `RECOVERED` status, records timestamp, officer, and audit log.
3. `testLostReportService_ResolveFromCollection_SecurityValidations`: Verifies unauthorized student caller is rejected (`403 Forbidden`) and claimant mismatch is rejected (`400 Bad Request`).
4. `testEndToEndCollection_ResolvesLinkedLostReport`: Verifies full HTTP endpoint flow through `OfficerClaimController` delegating via `CollectionService` to `LostReportService`.

---

## 6. Remaining Scope / Non-Blocking Notes
- Low-severity review items (e.g. moving orphaned `SystemSettingEntity`/`Repository`, extracting email utilities to `common.util`) remain non-blocking and were deliberately left out of this focused refactoring.
- The backend architecture is fully verified and ready for frontend integration.
