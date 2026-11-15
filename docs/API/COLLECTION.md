# Physical Collection, Return Status, and Reputation Ledger API Documentation

This document describes the REST APIs for physical item collection, collection verification by Security Officers, item return lifecycle transitions, linked lost report resolution, and the append-only reputation ledger.

---

## 1. Architectural & Security Principles

### 1.1 Physical Collection Verification
- Physical collection **must be explicitly confirmed** by an authorized Security Officer at the designated Security Office (e.g., Central Security Desk).
- Approval of a claim reserves the item (`CLAIM_PENDING`), but **never marks the item as returned**.
- Only after the claimant physically visits the Security Office, presents their physical University Student ID, and an officer confirms the handover through the backend does:
  - The claim transition to `COMPLETED`.
  - The found item transition to `RETURNED`.
  - A valid linked lost report transition to `RECOVERED`.
  - An immutable collection audit log (`item_collection_logs`) get created.
  - Eligible reputation points get awarded.
- **Students cannot confirm collection** (returns `403 Forbidden`).
- **Cross-office collection is rejected:** an officer assigned to Office B cannot confirm collection for an item held at Office A (`403 Forbidden`).

### 1.2 Linked Lost Report Recovery
- When confirming collection, the officer can optionally provide a `linkedLostReportId`.
- **Validation rules:**
  - The lost report must exist.
  - The lost report must belong to the approved claimant student (preventing tampering or wrong associations).
  - The lost report must be in `ACTIVE` status.
- Upon collection confirmation, the lost report transitions atomically to `RECOVERED`, with `resolvedBy` set to the officer, `resolvedAt` timestamped, and an immutable audit log recorded in `lost_report_audit_logs`.
- Without an explicit link, no lost report is modified (smart matching or fuzzy text guesses are strictly prohibited in MVP).

### 1.3 Concurrency & Idempotency
- **Concurrency Locking:** `CollectionService` acquires a pessimistic write lock (`SELECT ... FOR UPDATE` via `foundItemRepository.findByIdForUpdate`) on the found item during collection confirmation.
- **Database Constraints:** `item_collection_logs` enforces unique constraints on `claim_id` (`uk_collection_claim`) and `found_item_id` (`uk_collection_found_item`).
- **Conflict Handling:** Repeated requests or attempts to collect an already-returned item return **`409 Conflict`**.
- **Transaction Rollback:** All operations (claim update, item update, lost report update, collection log, and reputation award) execute in a single database transaction. If any step fails, the entire transaction rolls back.

### 1.4 Append-Only Reputation Ledger
- Points are never stored as mutable numbers without provenance. Every point change is recorded in `reputation_transactions`.
- **Transaction Types:**
  - `FOUND_ITEM_HANDOVER`: Awarded to finder upon verified physical handover to the Security Office (Issue #93 / Issue #96).
  - `ITEM_COLLECTION`: Awarded to claimant upon verified physical collection (configurable).
  - `ADMIN_ADJUSTMENT`: Reserved for audited manual adjustments.
- **Idempotency Protection:**
  - Unique idempotency keys (e.g. `FOUND_ITEM_HANDOVER:{foundItemId}` and `ITEM_COLLECTION:{claimId}`) and database unique constraint guarantee that no event can generate duplicate points.
- **Category-Based Rules:**
  - Point rules are configured per category and transaction type in `category_reputation_rules` with configurable defaults via `app.reputation` in `application.yml`.
  - No hardcoded point values in application code.

---

## 2. API Endpoints

### 2.1 Confirm Physical Collection
- **Endpoint:** `POST /api/v1/officer/claims/{claimId}/confirm-collection`
- **Security:** Bearer JWT token required (`SECURITY_OFFICER` or `SUPER_ADMIN`).
- **Request Body (`application/json`):**
  ```json
  {
    "officerNotes": "Verified physical Student ID at counter",
    "linkedLostReportId": "b0000000-0000-0000-0000-000000000001"
  }
  ```
  *(Note: `linkedLostReportId` and `officerNotes` are optional).*
- **Response (200 OK):**
  ```json
  {
    "collectionId": "e1234567-89ab-cdef-0123-456789abcdef",
    "claimId": "c1234567-89ab-cdef-0123-456789abcdef",
    "foundItemId": "f1234567-89ab-cdef-0123-456789abcdef",
    "claimantId": "u1234567-89ab-cdef-0123-456789abcdef",
    "claimantName": "Alice Smith",
    "claimantEmail": "alice@uom.lk",
    "confirmingOfficerId": "o1234567-89ab-cdef-0123-456789abcdef",
    "confirmingOfficerName": "Officer Dan",
    "collectedAt": "2026-11-15T10:30:00Z",
    "claimStatus": "COMPLETED",
    "itemAvailabilityStatus": "RETURNED",
    "linkedLostReportId": "b0000000-0000-0000-0000-000000000001",
    "lostReportStatus": "RECOVERED",
    "officerNotes": "Verified physical Student ID at counter",
    "pointsAwarded": 5
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Claim is not in `APPROVED` status, or linked lost report does not belong to claimant.
  - `403 Forbidden`: Requesting user is not a security officer / super admin, or officer is not assigned to the designated security office.
  - `404 Not Found`: Claim not found.
  - `409 Conflict`: Claim already `COMPLETED`, item already `RETURNED`, item not `CLAIM_PENDING`, or linked lost report is not `ACTIVE`.

---

### 2.2 Get My Reputation Balance
- **Endpoint:** `GET /api/v1/users/me/reputation`
- **Security:** Bearer JWT token required (Authenticated student/officer/admin).
- **Response (200 OK):**
  ```json
  {
    "userId": "u1234567-89ab-cdef-0123-456789abcdef",
    "currentBalance": 20,
    "totalEarned": 20,
    "totalTransactions": 2
  }
  ```

---

### 2.3 Get My Reputation Transactions History
- **Endpoint:** `GET /api/v1/users/me/reputation/transactions`
- **Security:** Bearer JWT token required.
- **Query Parameters:**
  - `page` (optional, default `0`)
  - `size` (optional, default `20`)
- **Response (200 OK):**
  ```json
  {
    "content": [
      {
        "id": "t1234567-89ab-cdef-0123-456789abcdef",
        "transactionType": "FOUND_ITEM_HANDOVER",
        "points": 15,
        "description": "Points awarded for handing over found item: Sony Headphones",
        "createdAt": "2026-11-15T10:20:00Z"
      },
      {
        "id": "t2234567-89ab-cdef-0123-456789abcdef",
        "transactionType": "ITEM_COLLECTION",
        "points": 5,
        "description": "Points awarded for successful item collection: USB Drive",
        "createdAt": "2026-11-15T10:30:00Z"
      }
    ],
    "page": {
      "size": 20,
      "number": 0,
      "totalElements": 2,
      "totalPages": 1
    }
  }
  ```
