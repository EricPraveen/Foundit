# Found Items & Officer Handover API Documentation

This document describes the REST APIs for Found Item reporting, image management, public discovery, and Security Officer physical handover verification.

---

## 1. Lifecycle & Privacy Model

```
Student Finds Item
        │
        ▼
POST /api/v1/found-items
(Report created with PENDING_HANDOVER & UNAVAILABLE status)
        │
        ├─► EXCLUDED from public search and browse APIs
        ├─► Only discoverable by finder via GET /api/v1/found-items/me
        │
        ▼
Physical visit to designated Central Security Office
        │
        ▼
POST /api/v1/officer/found-items/{id}/confirm-handover
(Authorized Security Officer verifies physical item)
        │
        ├─► Status transitions to CONFIRMED & AVAILABLE
        ├─► Records receiving officer ID & timestamp
        ├─► Appends immutable entry to found_item_handover_logs
        ▼
Public Discovery: GET /api/v1/found-items
(Students browse verified available items with sensitive finder details masked)
```

---

## 2. API Endpoints

### A. Found Item Reporting (Finder / Student)

#### 1. Report a Found Item
- **Endpoint:** `POST /api/v1/found-items`
- **Authorization:** Authenticated (`STUDENT`, `SECURITY_OFFICER`, `SUPER_ADMIN`)
- **Request Body:**
  ```json
  {
    "title": "Casio Scientific Calculator",
    "description": "Casio fx-991EX found on table 4 in discussion room",
    "categoryId": "b0000000-0000-0000-0000-000000000001",
    "locationId": "c0000000-0000-0000-0000-000000000001",
    "specificLocation": "Second floor discussion room B",
    "foundAt": "2026-11-15T08:30:00Z",
    "designatedSecurityOfficeId": "a0000000-0000-0000-0000-000000000001"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "e81d4404-d80e-4955-a13d-82afea50dfd6",
    "title": "Casio Scientific Calculator",
    "description": "Casio fx-991EX found on table 4 in discussion room",
    "categoryId": "b0000000-0000-0000-0000-000000000001",
    "categoryName": "Electronics & Accessories",
    "locationId": "c0000000-0000-0000-0000-000000000001",
    "locationName": "Central Library",
    "specificLocation": "Second floor discussion room B",
    "foundAt": "2026-11-15T08:30:00Z",
    "designatedSecurityOfficeId": "a0000000-0000-0000-0000-000000000001",
    "designatedSecurityOfficeName": "Central Security Office",
    "handoverStatus": "PENDING",
    "availabilityStatus": "UNAVAILABLE",
    "discoveredByUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "finderName": "Alice Perera",
    "receivedByOfficerId": null,
    "receivingOfficerName": null,
    "handoverConfirmedAt": null,
    "officerNotes": null,
    "images": [],
    "createdAt": "2026-11-15T08:35:00Z",
    "updatedAt": "2026-11-15T08:35:00Z"
  }
  ```

#### 2. Public Browse Available Found Items
- **Endpoint:** `GET /api/v1/found-items`
- **Authorization:** Public (`permitAll`)
- **Query Parameters:**
  - `query` (optional string): Keyword match against title or description.
  - `categoryId` (optional UUID): Filter by category.
  - `locationId` (optional UUID): Filter by campus location.
  - `fromDate`, `toDate` (optional ISO 8601): Filter by date range found.
  - `page`, `size`, `sort` (pagination parameters, default `foundAt,desc`).
- **Response (200 OK):**
  Returns paginated `FoundItemSummaryResponse` list. **Only items with `availabilityStatus: AVAILABLE` and `handoverStatus: CONFIRMED` are returned.** Finder personal identifiers are excluded.

#### 3. View Own Submitted Reports
- **Endpoint:** `GET /api/v1/found-items/me`
- **Authorization:** Authenticated
- **Response (200 OK):**
  Returns paginated list of all reports submitted by the authenticated user, including pending handovers.

#### 4. Update Pending Found Item Report
- **Endpoint:** `PUT /api/v1/found-items/{id}`
- **Authorization:** Finder only (while in `PENDING` status)
- **Response (200 OK):** Updated item details. Returns `409 Conflict` if item was already confirmed or cancelled.

#### 5. Cancel Pending Found Item Report
- **Endpoint:** `POST /api/v1/found-items/{id}/cancel`
- **Authorization:** Finder only (while in `PENDING` status)
- **Response (200 OK):** Transitions `handoverStatus` to `CANCELLED` and `availabilityStatus` to `UNAVAILABLE`.

#### 6. Upload Image Attachment
- **Endpoint:** `POST /api/v1/found-items/{id}/images`
- **Content-Type:** `multipart/form-data`
- **Authorization:** Finder or Security Officer
- **Constraints:** JPEG, PNG, or WebP; maximum 5 MB; maximum 5 images per item.
- **Response (201 Created):**
  ```json
  {
    "id": "f11d4404-d80e-4955-a13d-82afea50dfd7",
    "originalFilename": "calculator.jpg",
    "storagePath": "items/e81d4404-d80e-4955-a13d-82afea50dfd6/uuid.jpg",
    "publicUrl": "/api/v1/storage/found-items/items/e81d4404.../uuid.jpg",
    "contentType": "image/jpeg",
    "fileSize": 204800,
    "createdAt": "2026-11-15T08:36:00Z"
  }
  ```

---

### B. Security Officer Handover Management

#### 1. List Pending Handover Items for Assigned Office
- **Endpoint:** `GET /api/v1/officer/found-items/pending-handover`
- **Authorization:** `SECURITY_OFFICER` or `SUPER_ADMIN`
- **Response (200 OK):**
  Returns paginated list of items with `PENDING` status designated for the officer's security office.

#### 2. List Overdue Pending Handovers (>24 Hours)
- **Endpoint:** `GET /api/v1/officer/found-items/overdue-handover?hours=24`
- **Authorization:** `SECURITY_OFFICER` or `SUPER_ADMIN`
- **Response (200 OK):**
  Returns items that have remained in `PENDING` status longer than the specified hours threshold (default 24 hours).

#### 3. Confirm Physical Handover
- **Endpoint:** `POST /api/v1/officer/found-items/{id}/confirm-handover`
- **Authorization:** `SECURITY_OFFICER` or `SUPER_ADMIN`
- **Validation Rules:**
  - Officer must be assigned to the item's designated security office.
  - Item must be in `PENDING` status (returns `409 Conflict` on duplicate confirmation).
- **Request Body (optional):**
  ```json
  {
    "officerNotes": "Item verified. Blue case with name sticker matching student initials."
  }
  ```
- **Response (200 OK):**
  Item status updated to `CONFIRMED` and `AVAILABLE`. Audit trail record inserted.

#### 4. View Handover Audit History
- **Endpoint:** `GET /api/v1/officer/found-items/{id}/handover-history`
- **Authorization:** `SECURITY_OFFICER` or `SUPER_ADMIN`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "7fa85f64-5717-4562-b3fc-2c963f66afa7",
      "foundItemId": "e81d4404-d80e-4955-a13d-82afea50dfd6",
      "finderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "receivingOfficerId": "4fa85f64-5717-4562-b3fc-2c963f66afa8",
      "securityOfficeId": "a0000000-0000-0000-0000-000000000001",
      "handoverConfirmedAt": "2026-11-15T09:00:00Z",
      "notes": "Item verified. Blue case with name sticker matching student initials.",
      "createdAt": "2026-11-15T09:00:00Z"
    }
  ]
  ```
