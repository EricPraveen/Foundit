# Claims, Private Evidence, and Officer Decisions API Documentation

This document describes the REST APIs for student ownership claims against available Found Items, private ownership evidence handling, Security Officer claim review and decisions, and concurrency protection.

---

## 1. Architectural & Privacy Principles

### 1.1 Private Ownership Evidence
- Claims require sensitive ownership evidence:
  - **University Student ID Card image** (verifying student enrollment).
  - **Index Number** (student academic index).
  - **Ownership proof** (purchase invoice, receipt, photo of item prior to loss, box photo, serial number proof, or identifying mark details).
- **Zero Public Exposure:**
  - Evidence files are stored in private storage (`claims/{claimId}/...`) and **never** exposed through public URLs or public browse APIs (`GET /api/v1/found-items`).
  - Claim details and claimant identities are strictly excluded from public item discovery DTOs.

### 1.2 Access Control & Anti-IDOR Protections
- **Students:**
  - Can view and manage only their own submitted claims (`GET /api/v1/claims/me`).
  - Attempting to access another student's claim or evidence returns **`404 Not Found`**, preventing claim ID enumeration and IDOR attacks.
  - Can cancel their own claim only while in `PENDING` status.
- **Security Officers:**
  - Can review claims and download evidence files **only for items assigned to their designated Security Office**.
  - Attempting to access or decide a claim belonging to a different Security Office returns **`403 Forbidden`**.

### 1.3 Concurrency-Safe Approval (Single Active Approved Claim Rule)
- Multiple students may submit claims for the same available item.
- Approval uses **pessimistic write locking** (`SELECT ... FOR UPDATE` via `foundItemRepository.findByIdForUpdate`) and a **partial unique database index** (`uq_found_item_approved_claim ON claims(found_item_id) WHERE status = 'APPROVED'`) to guarantee that two officers cannot approve different claims for the same item concurrently.
- When a claim is approved:
  - The approved claim transitions to `APPROVED`.
  - The Found Item transitions to `CLAIM_PENDING` (reserved for physical collection).
  - Other pending claims for the same item **remain in `PENDING` status** (not silently deleted or discarded), preserving full audit history and allowing fallback review if collection fails.

### 1.4 Rejection and Resubmission
- An officer rejecting a claim must provide a mandatory `rejectionReason`.
- The Found Item remains `AVAILABLE`.
- A rejected claimant is permitted to submit a new claim with updated evidence.

---

## 2. Claim Lifecycle Model

```
Student submits claim on AVAILABLE item
                  │
                  ▼
               PENDING
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   APPROVED    REJECTED   CANCELLED
 (Item becomes           (Withdrawn)
 CLAIM_PENDING)
       │
       ▼
   COMPLETED
(Physical collection
  in BACKEND-07)
```

---

## 3. Student REST APIs (`/api/v1`)

### 1. Submit a Claim
- **Endpoint:** `POST /api/v1/found-items/{itemId}/claims`
- **Content-Type:** `multipart/form-data`
- **Authorization:** Authenticated Student
- **Parameters & Parts:**
  - `indexNumber` (string, required): e.g. `"210001A"`
  - `ownershipDescription` (string, required, min 10 chars): Detailed description establishing ownership.
  - `studentIdCard` (file, required): JPEG, PNG, WebP, or PDF (max 5 MB).
  - `ownershipProof` (file, required): JPEG, PNG, WebP, or PDF (max 5 MB).
  - `additionalProof` (file, optional): JPEG, PNG, WebP, or PDF (max 5 MB).
- **Response (201 Created):**
  ```json
  {
    "id": "e81d4404-d80e-4955-a13d-82afea50df91",
    "foundItemId": "c0000000-0000-0000-0000-000000000001",
    "foundItemTitle": "iPhone 13 Midnight Black",
    "designatedSecurityOfficeId": "a0000000-0000-0000-0000-000000000001",
    "designatedSecurityOfficeName": "Central Security Desk",
    "claimant": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "Alice Student",
      "email": "alice@uom.lk",
      "phoneNumber": "+94771234567",
      "indexNumber": "210001A"
    },
    "ownershipDescription": "This is my iPhone 13. Lockscreen shows my dog and passcode is 123456.",
    "status": "PENDING",
    "reviewingOfficerId": null,
    "reviewingOfficerName": null,
    "reviewNotes": null,
    "rejectionReason": null,
    "submittedAt": "2026-11-15T09:00:00Z",
    "reviewedAt": null,
    "cancelledAt": null,
    "evidence": [
      {
        "id": "7a1d4404-d80e-4955-a13d-82afea50df01",
        "claimId": "e81d4404-d80e-4955-a13d-82afea50df91",
        "evidenceType": "STUDENT_ID_CARD",
        "originalFilename": "student_id.png",
        "contentType": "image/png",
        "fileSize": 204800,
        "createdAt": "2026-11-15T09:00:00Z"
      },
      {
        "id": "7a1d4404-d80e-4955-a13d-82afea50df02",
        "claimId": "e81d4404-d80e-4955-a13d-82afea50df91",
        "evidenceType": "OWNERSHIP_PROOF",
        "originalFilename": "receipt.pdf",
        "contentType": "application/pdf",
        "fileSize": 512000,
        "createdAt": "2026-11-15T09:00:00Z"
      }
    ],
    "createdAt": "2026-11-15T09:00:00Z",
    "updatedAt": "2026-11-15T09:00:00Z"
  }
  ```

### 2. View My Claims
- **Endpoint:** `GET /api/v1/claims/me`
- **Query Parameters:** `page`, `size`
- **Response (200 OK):** Paginated `ClaimSummaryResponse` for the authenticated student.

### 3. View Specific Claim
- **Endpoint:** `GET /api/v1/claims/{claimId}`
- **Response:**
  - `200 OK`: Detailed claim with evidence list.
  - `404 Not Found`: If claim does not exist or caller is not the owner (prevents enumeration).

### 4. Cancel Pending Claim
- **Endpoint:** `POST /api/v1/claims/{claimId}/cancel`
- **Condition:** Caller must be the claimant; claim must be `PENDING`.
- **Response:** `200 OK` (status updated to `CANCELLED`).

### 5. Download Evidence File
- **Endpoint:** `GET /api/v1/claims/{claimId}/evidence/{evidenceId}`
- **Response:**
  - `200 OK`: Binary stream of the evidence file with appropriate `Content-Type` and `Content-Disposition`.
  - `404 Not Found`: If unauthorized or evidence not found.

---

## 4. Security Officer REST APIs (`/api/v1/officer/claims`)

Protected by `@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")`.

### 1. List Claims in Officer Office Scope
- **Endpoint:** `GET /api/v1/officer/claims`
- **Query Parameters:** `status` (optional), `itemId` (optional), `page`, `size`, `sort`
- **Scope Rule:** Automatically restricted to items assigned to the officer's `SecurityOffice`.
- **Response (200 OK):** Paginated `ClaimResponse` list.

### 2. View Claim Details for Review
- **Endpoint:** `GET /api/v1/officer/claims/{claimId}`
- **Response:**
  - `200 OK`: Detailed claim, claimant contact info, and evidence list.
  - `403 Forbidden`: If claim belongs to an item in a different security office.

### 3. Approve Claim
- **Endpoint:** `POST /api/v1/officer/claims/{claimId}/approve`
- **Request Body (optional):**
  ```json
  {
    "reviewNotes": "Original purchase invoice and Student ID verified. Ownership confirmed."
  }
  ```
- **Behavior:**
  - Serialized through pessimistic lock on `FoundItemEntity`.
  - Verifies no existing approved claim for the item.
  - Transitions claim to `APPROVED`.
  - Transitions Found Item to `CLAIM_PENDING` (reserved).
  - Other pending claims remain in `PENDING` status.
- **Response (200 OK):** Updated claim response.

### 4. Reject Claim
- **Endpoint:** `POST /api/v1/officer/claims/{claimId}/reject`
- **Request Body:**
  ```json
  {
    "rejectionReason": "Provided invoice does not match the serial number or purchase date of the item."
  }
  ```
- **Behavior:**
  - Transitions claim to `REJECTED`.
  - Found Item remains `AVAILABLE`.
  - Claimant may submit a new claim with new evidence.
- **Response (200 OK):** Updated claim response.

### 5. Download Evidence for Officer Review
- **Endpoint:** `GET /api/v1/officer/claims/{claimId}/evidence/{evidenceId}`
- **Response:** `200 OK` streaming binary file data within officer scope.
