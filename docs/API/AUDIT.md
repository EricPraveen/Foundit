# Audit Trail API Documentation

This document describes the immutable audit trail architecture and the Super Admin query endpoints for inspecting system audit events.

---

## 1. Architectural & Privacy Design

- **Immutability:** The `audit_logs` table is strictly append-only. No `UPDATE` or `DELETE` endpoints or repository methods exist for audit logs.
- **Transaction Independence:** The audit logging service uses Spring's `Propagation.REQUIRES_NEW` to ensure audit records are committed independently or safely isolated.
- **Privacy & Sanitization:**
  - Sensitive fields such as passwords, tokens, full student index numbers, and claim evidence URLs are filtered, masked, or stripped prior to storing payload snapshots.
- **Access Control:**
  - Auditing inspection is restricted strictly to users with the `SUPER_ADMIN` role.
  - Students and Security Officers cannot query `/api/v1/admin/audit-logs/**` (returns `403 Forbidden`).

---

## 2. Endpoints

### 2.1 Query Audit Logs
- **Endpoint:** `GET /api/v1/admin/audit-logs`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Query Parameters:**
  - `actorId` (optional UUID): Filter by the UUID of the actor performing the action.
  - `entityType` (optional string): Filter by entity type (e.g. `FOUND_ITEM`, `CLAIM`, `LOST_REPORT`, `USER`, `SECURITY_OFFICE`, `CATEGORY`, `LOCATION`).
  - `action` (optional string): Filter by action name (e.g. `HANDOVER_CONFIRMED`, `CLAIM_APPROVED`, `COLLECTION_CONFIRMED`, `STATUS_CHANGED`, `ROLE_CHANGED`).
  - `page` (optional integer, default `0`): Page number.
  - `size` (optional integer, default `20`): Page size.
- **Response (200 OK):**
  ```json
  {
    "content": [
      {
        "id": "a1234567-89ab-cdef-0123-456789abcdef",
        "actorId": "u1234567-89ab-cdef-0123-456789abcdef",
        "actorEmail": "officer@uom.lk",
        "actorRole": "SECURITY_OFFICER",
        "action": "HANDOVER_CONFIRMED",
        "entityType": "FOUND_ITEM",
        "entityId": "f1234567-89ab-cdef-0123-456789abcdef",
        "details": "Confirmed physical handover for found item",
        "payload": "{\"itemId\":\"f1234567-89ab-cdef-0123-456789abcdef\",\"office\":\"Central Security Desk\"}",
        "timestamp": "2026-11-15T10:15:30Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 20,
    "number": 0
  }
  ```

---

### 2.2 Get Audit Log Entry by ID
- **Endpoint:** `GET /api/v1/admin/audit-logs/{id}`
- **Security:** Bearer JWT (`SUPER_ADMIN`)
- **Response (200 OK):** Single `AuditLogResponse` object matching the above schema.
- **Errors:** `404 Not Found` if audit log entry does not exist.
