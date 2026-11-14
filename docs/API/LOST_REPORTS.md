# Private Lost Reports API Documentation

This document describes the REST APIs for private Lost Report submission, owner lifecycle management, image attachments, Security Officer search within office scope, and immutable audit logging.

---

## 1. Architectural & Privacy Principles

### 1.1 Complete Independence from Found Items
- Lost Reports and Found Items are **strictly separate domain models**.
- Either report may be submitted first without requiring the other.
- No automatic matching or ownership assignment is performed.

### 1.2 Strict Privacy & Zero Public Exposure
- Lost Reports contain sensitive personal ownership details (e.g., distinctive marks, serial numbers, personal belongings) and are **never publicly discoverable**.
- Public endpoints (`GET /api/v1/found-items`) strictly exclude all lost report records.
- Students can **only** browse and view their own submitted reports.
- Any attempt by a student to retrieve or modify another student's lost report by ID returns **`404 Not Found`**, strictly preventing report ID enumeration and IDOR vulnerabilities.

### 1.3 Security Office Scope Isolation
- Security Officers only have operational access to Lost Reports designated to their assigned `SecurityOffice`.
- Any attempt by a Security Officer to access a report from a different Security Office returns **`403 Forbidden`**.
- Operational student contact information (name, email, phone) is exposed to officers solely for returning items; unverified Index Numbers or private student ID images are never exposed.

---

## 2. Lifecycle Model

```
Student submits Lost Report
           │
           ▼
        ACTIVE
           │
     ┌─────┴─────────────────┐
     ▼                       ▼
  RESOLVED               CANCELLED
(Recovered)          (Withdrawn / Closed)
```

- **ACTIVE:** The report is open and actively searched. Owner can update details, upload/delete images, or transition to RESOLVED/CANCELLED.
- **RESOLVED:** Item was recovered by student or returned by office. Resolution notes recorded. Terminal state (cannot transition back to ACTIVE).
- **CANCELLED:** Report was withdrawn by owner or cancelled by officer. Cancellation reason recorded. Terminal state.

---

## 3. Student REST APIs (`/api/v1/lost-reports`)

### 1. Submit a Lost Report
- **Endpoint:** `POST /api/v1/lost-reports`
- **Authorization:** Authenticated (`STUDENT`, `SUPER_ADMIN`)
- **Request Body:**
  ```json
  {
    "title": "Casio Scientific Calculator",
    "description": "Casio fx-991EX left on desk in study area",
    "distinctiveFeatures": "Name sticker 'Alice' inside battery cover, scratch on back",
    "categoryId": "b0000000-0000-0000-0000-000000000001",
    "locationId": "c0000000-0000-0000-0000-000000000001",
    "specificLocation": "Second floor cubicle #12",
    "lostAt": "2026-11-15T08:00:00Z",
    "designatedSecurityOfficeId": "a0000000-0000-0000-0000-000000000001"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "f81d4404-d80e-4955-a13d-82afea50dfd7",
    "title": "Casio Scientific Calculator",
    "description": "Casio fx-991EX left on desk in study area",
    "distinctiveFeatures": "Name sticker 'Alice' inside battery cover, scratch on back",
    "category": { "id": "b0000000-0000-0000-0000-000000000001", "name": "Electronics", "active": true },
    "location": { "id": "c0000000-0000-0000-0000-000000000001", "name": "Central Library", "active": true },
    "specificLocation": "Second floor cubicle #12",
    "lostAt": "2026-11-15T08:00:00Z",
    "designatedSecurityOffice": { "id": "a0000000-0000-0000-0000-000000000001", "name": "Central Security Desk", "active": true },
    "status": "ACTIVE",
    "resolutionNotes": null,
    "resolvedAt": null,
    "resolvedByUserId": null,
    "cancellationReason": null,
    "cancelledAt": null,
    "images": [],
    "studentContact": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "Alice Student",
      "email": "alice@uom.lk",
      "phoneNumber": "+94771234567"
    },
    "createdAt": "2026-11-15T08:05:00Z",
    "updatedAt": "2026-11-15T08:05:00Z"
  }
  ```

### 2. View My Lost Reports
- **Endpoint:** `GET /api/v1/lost-reports`
- **Authorization:** Authenticated
- **Query Parameters:** `page`, `size`
- **Response (200 OK):** Paginated list of lost reports owned by the authenticated user.

### 3. View Specific Lost Report
- **Endpoint:** `GET /api/v1/lost-reports/{id}`
- **Authorization:** Authenticated
- **Response:**
  - `200 OK`: Returns report details if owned by caller.
  - `404 Not Found`: If report does not exist or caller is not the owner (prevents enumeration).

### 4. Update Lost Report
- **Endpoint:** `PUT /api/v1/lost-reports/{id}`
- **Authorization:** Authenticated Owner
- **Condition:** Must be in `ACTIVE` status.
- **Response:**
  - `200 OK`: Successfully updated.
  - `404 Not Found`: If not owner.
  - `409 Conflict`: If report is already `RESOLVED` or `CANCELLED`.

### 5. Cancel Lost Report
- **Endpoint:** `POST /api/v1/lost-reports/{id}/cancel`
- **Authorization:** Authenticated Owner
- **Condition:** Must be in `ACTIVE` status.
- **Request Body (optional):** `{"cancellationReason": "Found it at home"}`
- **Response (200 OK):** Transitions status to `CANCELLED`.

### 6. Resolve Lost Report
- **Endpoint:** `POST /api/v1/lost-reports/{id}/resolve`
- **Authorization:** Authenticated Owner
- **Condition:** Must be in `ACTIVE` status.
- **Request Body (optional):** `{"resolutionNotes": "Recovered from friend"}`
- **Response (200 OK):** Transitions status to `RESOLVED`.

### 7. Image Upload & Deletion
- **Upload:** `POST /api/v1/lost-reports/{id}/images` (multipart/form-data: `file`)
  - Formats: JPEG, PNG, WebP (max 5 MB, max 3 images per report).
- **Delete:** `DELETE /api/v1/lost-reports/{id}/images/{imageId}`

---

## 4. Officer REST APIs (`/api/v1/officer/lost-reports`)

Protected by `@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")`.

### 1. Search & Filter Lost Reports in Officer Scope
- **Endpoint:** `GET /api/v1/officer/lost-reports`
- **Query Parameters:**
  - `query` (optional string): Keyword match against title, description, or distinctive features.
  - `status` (optional `ACTIVE`, `RESOLVED`, `CANCELLED`).
  - `categoryId` (optional UUID).
  - `locationId` (optional UUID).
  - `fromDate`, `toDate` (optional ISO 8601 timestamps).
  - `page`, `size`, `sort` (default `createdAt,desc`).
- **Scope Rule:** If `SECURITY_OFFICER`, automatically scoped to the officer's assigned `SecurityOffice`.
- **Response (200 OK):** Paginated lost reports including `studentContact` (name, email, phone) for operational liaison.

### 2. View Specific Lost Report in Officer Scope
- **Endpoint:** `GET /api/v1/officer/lost-reports/{id}`
- **Response:**
  - `200 OK`: Detailed lost report with operational student contact.
  - `403 Forbidden`: If report belongs to a different security office.
  - `404 Not Found`: If report does not exist.

### 3. Officer Resolve Lost Report
- **Endpoint:** `POST /api/v1/officer/lost-reports/{id}/resolve`
- **Condition:** Must be within officer's office scope and report must be `ACTIVE`.
- **Request Body (optional):** `{"resolutionNotes": "Item returned to student at security desk"}`
- **Response:** `200 OK` (status updated to `RESOLVED`, `resolvedByUserId` set to officer).

### 4. Officer Cancel Lost Report
- **Endpoint:** `POST /api/v1/officer/lost-reports/{id}/cancel`
- **Condition:** Must be within officer's office scope and report must be `ACTIVE`.
- **Request Body (optional):** `{"cancellationReason": "Duplicate report identified"}`
- **Response:** `200 OK` (status updated to `CANCELLED`).

### 5. View Lifecycle Audit History
- **Endpoint:** `GET /api/v1/officer/lost-reports/{id}/audit-history`
- **Response (200 OK):** List of immutable audit logs:
  ```json
  [
    {
      "id": "e81d4404-d80e-4955-a13d-82afea50df99",
      "lostReportId": "f81d4404-d80e-4955-a13d-82afea50dfd7",
      "actorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "actorRole": "STUDENT",
      "action": "REPORT_CREATED",
      "previousStatus": null,
      "newStatus": "ACTIVE",
      "details": "Lost report created by student",
      "createdAt": "2026-11-15T08:05:00Z"
    }
  ]
  ```
