# Super Admin Governance & System Management API Documentation

This document describes the REST APIs available exclusively to Super Administrators (`ROLE_SUPER_ADMIN`) for user lifecycle management, role delegation, category and location reference data management, reputation rule administration, and system configuration inspection.

---

## 1. Security & Governance Invariants

- **Role Requirement:** All endpoints in `/api/v1/admin/**` require authenticated users with `ROLE_SUPER_ADMIN`.
- **Last Super Admin Invariant:** A Super Admin cannot deactivate or demote themselves if they are the only remaining active Super Admin in the system (`400 Bad Request`).
- **Email Verification Guard:** An admin cannot activate an account whose university email address has not been verified (`400 Bad Request`).
- **Role Assignment Controls:**
  - When promoting a user to `SECURITY_OFFICER`, if the user does not yet have a security officer profile, one is automatically provisioned and linked to the Central Security Office.
  - When demoting an officer to `STUDENT`, their officer profile is deactivated.
- **Audit Logging:** Every user status modification, role change, and reference data mutation is immediately persisted to the immutable `audit_logs` table.

---

## 2. User Management Endpoints

### 2.1 List Users
- **Endpoint:** `GET /api/v1/admin/users`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Query Parameters:**
  - `query` (optional string): Case-insensitive search on email or full name.
  - `role` (optional string): Filter by role (`STUDENT`, `SECURITY_OFFICER`, `SUPER_ADMIN`).
  - `status` (optional string): Filter by account status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`).
  - `page` (optional integer, default `0`): Page number.
  - `size` (optional integer, default `20`): Page size.
- **Response (200 OK):**
  ```json
  {
    "content": [
      {
        "id": "u1234567-89ab-cdef-0123-456789abcdef",
        "email": "student@uom.lk",
        "fullName": "Jane Doe",
        "role": "STUDENT",
        "status": "ACTIVE",
        "emailVerified": true,
        "createdAt": "2026-11-14T10:00:00Z",
        "updatedAt": "2026-11-15T08:30:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
  ```

---

### 2.2 Get User by ID
- **Endpoint:** `GET /api/v1/admin/users/{userId}`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Response (200 OK):** Detailed user object matching schema above.
- **Errors:** `404 Not Found` if user does not exist.

---

### 2.3 Update User Status
- **Endpoint:** `PATCH /api/v1/admin/users/{userId}/status`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Request Body (`application/json`):**
  ```json
  {
    "status": "SUSPENDED"
  }
  ```
  *(Permitted values: `ACTIVE`, `SUSPENDED`, `DEACTIVATED`)*
- **Response (200 OK):** Updated `AdminUserResponse`.
- **Validation Rules & Invariants:**
  - Cannot deactivate the last active Super Admin (`400 Bad Request`).
  - Cannot activate an account with `emailVerified = false` (`400 Bad Request`).

---

### 2.4 Update User Role
- **Endpoint:** `PATCH /api/v1/admin/users/{userId}/role`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Request Body (`application/json`):**
  ```json
  {
    "role": "SECURITY_OFFICER"
  }
  ```
  *(Permitted values: `STUDENT`, `SECURITY_OFFICER`, `SUPER_ADMIN`)*
- **Response (200 OK):** Updated `AdminUserResponse`.
- **Validation Rules & Invariants:**
  - Cannot demote the last active Super Admin (`400 Bad Request`).
  - Promoting to `SECURITY_OFFICER` provisions an active officer profile linked to Central Security Office.

---

## 3. Reputation Rules Administration

### 3.1 List Reputation Rules
- **Endpoint:** `GET /api/v1/admin/reputation-rules`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Response (200 OK):**
  ```json
  [
    {
      "id": "r1234567-89ab-cdef-0123-456789abcdef",
      "categoryId": "c1234567-89ab-cdef-0123-456789abcdef",
      "categoryName": "Electronics",
      "transactionType": "FOUND_ITEM_HANDOVER",
      "points": 10,
      "isActive": true
    }
  ]
  ```

---

### 3.2 Update Reputation Rule
- **Endpoint:** `PUT /api/v1/admin/reputation-rules/{id}`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Request Body (`application/json`):**
  ```json
  {
    "points": 15,
    "isActive": true
  }
  ```
- **Response (200 OK):** Updated `ReputationRuleResponse`.

---

## 4. System Configuration Inspection

### 4.1 Get Active System Configuration
- **Endpoint:** `GET /api/v1/admin/system-config`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Response (200 OK):**
  ```json
  {
    "environment": "test",
    "unclaimedThresholdDays": 30,
    "claimPendingReminderDays": 7,
    "storageType": "local",
    "emailProvider": "mock",
    "defaultHandoverPoints": 10,
    "defaultCollectionPoints": 5
  }
  ```
- **Policy Notes:**
  - `unclaimedThresholdDays`: Duration after handover confirmation before an unclaimed item is eligible for `UNCLAIMED` status transition.
  - No automatic disposition, transfer, or donation occurs without explicit physical officer verification.
