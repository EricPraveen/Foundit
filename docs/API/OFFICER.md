# Security Officer API Documentation

This document describes the REST APIs available to Security Officers (`SECURITY_OFFICER` and `SUPER_ADMIN` roles) at the Central Security Office (and designated campus security posts).

---

## 1. Security & Operational Scope

- **Role Requirement:** Endpoints require an authenticated user with `ROLE_SECURITY_OFFICER` or `ROLE_SUPER_ADMIN`.
- **Office Scoping:** For security officers assigned to a specific `SecurityOfficeEntity`, queries and operational actions are strictly scoped to their assigned security office. Super Admins operate with global scope across all offices.
- **Privacy Enforcement:**
  - Sensitive claimant and owner information (e.g., student ID card images, index numbers, private claim evidence) is accessible only to authorized officers during official verification workflows.
  - Officer operational endpoints are completely isolated from student endpoints; students calling `/api/v1/officer/**` receive `403 Forbidden`.
- **Audit Logging:** Every critical operational action (handover confirmation, claim approval/rejection, physical collection confirmation) is recorded in immutable audit tables (`audit_logs`, `item_collection_logs`, `lost_report_audit_logs`).

---

## 2. Endpoints

### 2.1 Officer Operational Dashboard

Returns real-time operational metrics and workload counts for the authenticated officer's security office (or global counts for Super Admin).

- **Endpoint:** `GET /api/v1/officer/dashboard`
- **Security:** Bearer JWT (`SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Query Parameters:** None
- **Response (200 OK):**
  ```json
  {
    "officeId": "00000000-0000-0000-0000-000000000001",
    "officeName": "Central Security Desk",
    "availableItems": 14,
    "pendingHandovers": 3,
    "pendingClaims": 5,
    "pendingCollection": 2,
    "returnedItems": 42,
    "unclaimedItems": 1,
    "activeLostReports": 8
  }
  ```
- **Operational Metrics Breakdown:**
  - `availableItems`: Items physically received, verified, published, and currently available (`availabilityStatus = AVAILABLE`).
  - `pendingHandovers`: Found item reports awaiting physical receipt confirmation at the counter (`handoverStatus = PENDING`).
  - `pendingClaims`: Claims submitted by students awaiting officer review (`status = PENDING`).
  - `pendingCollection`: Approved claims where the item is reserved and awaiting physical counter collection (`availabilityStatus = CLAIM_PENDING`).
  - `returnedItems`: Items whose physical handover to claimant has been confirmed (`availabilityStatus = RETURNED`).
  - `unclaimedItems`: Items exceeding the holding retention period (`availabilityStatus = UNCLAIMED`).
  - `activeLostReports`: Lost reports currently open and awaiting potential matches (`status = ACTIVE`).

---

### 2.2 Officer Found Items Inventory

Provides comprehensive listing and filtering across all found items under the officer's jurisdiction, including items in `PENDING_HANDOVER`, `AVAILABLE`, `CLAIM_PENDING`, `RETURNED`, or `UNCLAIMED`.

- **Endpoint:** `GET /api/v1/officer/found-items`
- **Security:** Bearer JWT (`SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Query Parameters:**
  - `query` (optional string): Keyword search on item title, description, or reference number.
  - `categoryId` (optional UUID): Filter by category.
  - `status` (optional string): Filter by availability status (`AVAILABLE`, `CLAIM_PENDING`, `RETURNED`, `UNCLAIMED`, `PENDING_HANDOVER`).
  - `handoverStatus` (optional string): Filter by handover status (`PENDING`, `CONFIRMED`).
  - `page` (optional integer, default `0`): Page index.
  - `size` (optional integer, default `20`): Page size.
- **Response (200 OK):** Paginated response containing found item summaries with internal reference IDs, handover timestamps, and current lifecycle state.

---

### 2.3 Physical Handover Confirmation

Confirms that a student/finder has physically deposited a found item at the Central Security Office counter.

- **Endpoint:** `POST /api/v1/officer/found-items/{id}/confirm-handover`
- **Security:** Bearer JWT (`SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Request Body (`application/json`):**
  ```json
  {
    "notes": "Verified item physical condition at Central Security counter"
  }
  ```
- **Response (200 OK):** Updated Found Item detail object with `handoverStatus = CONFIRMED`, `availabilityStatus = AVAILABLE`, and `handoverConfirmedAt` timestamp.
- **Effects:**
  - Item transitions to `AVAILABLE` and becomes discoverable in public browsing.
  - Finder receives reputation points (`FOUND_ITEM_HANDOVER`) via idempotent ledger.
  - In-app and simulated email notifications dispatched to finder.
  - Immutable record written to `audit_logs`.

---

### 2.4 Claim Review & Ownership Decisions

Officers review student claim submissions, inspecting private ownership proof, serial numbers, and student identification.

#### List Pending Claims for Office
- **Endpoint:** `GET /api/v1/officer/claims`
- **Query Parameters:** `status` (default `PENDING`), `page`, `size`
- **Response (200 OK):** List of claims with claimant identity details.

#### Approve Claim
- **Endpoint:** `POST /api/v1/officer/claims/{id}/approve`
- **Request Body (`application/json`):**
  ```json
  {
    "decisionNotes": "Serial number matched claimant invoice and Student ID verified"
  }
  ```
- **Response (200 OK):** Approved claim object (`status = APPROVED`). Item transitions to `CLAIM_PENDING`. Competing pending claims rejected or put on hold.

#### Reject Claim
- **Endpoint:** `POST /api/v1/officer/claims/{id}/reject`
- **Request Body (`application/json`):**
  ```json
  {
    "decisionNotes": "Item color and distinctive scratches do not match claimant description"
  }
  ```
- **Response (200 OK):** Rejected claim object (`status = REJECTED`).

---

### 2.5 Physical Collection & Return Confirmation

Confirms physical collection when the approved claimant visits the office with their University Student ID card.

- **Endpoint:** `POST /api/v1/officer/claims/{claimId}/confirm-collection`
- **Request Body (`application/json`):**
  ```json
  {
    "officerNotes": "Claimant verified with University ID. Item handed over.",
    "linkedLostReportId": "00000000-0000-0000-0000-000000000002"
  }
  ```
- **Response (200 OK):** Item Collection response object.
- **Effects:**
  - Item availability status transitions to `RETURNED`.
  - Claim transitions to `COMPLETED`.
  - If `linkedLostReportId` is provided and valid, linked lost report transitions to `RECOVERED`.
  - Immutable record written to `item_collection_logs` and `audit_logs`.
  - Collection notifications sent to claimant and finder.

---

### 2.6 Collection History Inspection

#### Get Collection Details by Found Item ID
- **Endpoint:** `GET /api/v1/officer/found-items/{id}/collection`
- **Security:** Bearer JWT (`SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Response (200 OK):**
  ```json
  {
    "collectionId": "e1234567-89ab-cdef-0123-456789abcdef",
    "claimId": "c1234567-89ab-cdef-0123-456789abcdef",
    "foundItemId": "f1234567-89ab-cdef-0123-456789abcdef",
    "claimantId": "u1234567-89ab-cdef-0123-456789abcdef",
    "claimantName": "Alice Smith",
    "claimantEmail": "alice@uom.lk",
    "officerId": "o1234567-89ab-cdef-0123-456789abcdef",
    "officerName": "Officer John",
    "securityOfficeId": "s1234567-89ab-cdef-0123-456789abcdef",
    "securityOfficeName": "Central Security Desk",
    "collectedAt": "2026-11-15T10:00:00Z",
    "officerNotes": "Verified physical Student ID at counter",
    "linkedLostReportId": "b0000000-0000-0000-0000-000000000001"
  }
  ```
- **Errors:** `404 Not Found` if item has not been collected yet.

#### Get Collection Details by Claim ID
- **Endpoint:** `GET /api/v1/officer/claims/{claimId}/collection`
- **Security:** Bearer JWT (`SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Response (200 OK):** Collection details identical to above.
- **Errors:** `404 Not Found` if claim has not completed collection.
