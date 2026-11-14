# User Profiles & Reference Data API Contract

Base paths:
- User Profiles: `/api/v1/users`
- Central Security Office & Officers: `/api/v1/security-office` & `/api/v1/admin/security-office` & `/api/v1/admin/officers`
- Categories: `/api/v1/categories` & `/api/v1/admin/categories`
- Campus Locations: `/api/v1/locations` & `/api/v1/admin/locations`

---

## 1. User Profiles

### Get Authenticated User Profile
- **Endpoint:** `GET /api/v1/users/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "id": "c1f7a0b3-982e-4cb2-8071-8b2c28a8d114",
      "email": "student@uom.lk",
      "fullName": "Student Name",
      "role": "STUDENT",
      "status": "ACTIVE",
      "emailVerified": true,
      "indexNumber": "220001A",
      "phoneNumber": "+94771234567",
      "indexNumberVerified": false,
      "createdAt": "2026-11-14T18:00:00Z"
    }
    ```
  - `401 Unauthorized`: Unauthenticated.

### Update Authenticated User Profile
- **Endpoint:** `PUT /api/v1/users/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Security Invariant:** User cannot alter role, status, email, or email verification status. Changing `indexNumber` keeps `indexNumberVerified: false` (pending manual officer verification).
- **Request Body:**
  ```json
  {
    "fullName": "Updated Student Name",
    "phoneNumber": "+94779876543",
    "indexNumber": "220001A"
  }
  ```

---

## 2. Central Security Office & Officers

### Get Central Security Office Public Details
- **Endpoint:** `GET /api/v1/security-office`
- **Access:** Public / Authenticated
- **Responses:**
  - `200 OK`:
    ```json
    {
      "id": "a0000000-0000-0000-0000-000000000001",
      "name": "Central Security Office",
      "campusLocation": "Main Administrative Complex, University of Moratuwa",
      "contactEmail": "security@uom.lk",
      "contactPhone": "+94 11 265 0301",
      "operatingHours": "24/7 Custody and Handover Desk",
      "active": true
    }
    ```

### Update Central Security Office Details
- **Endpoint:** `PUT /api/v1/admin/security-office`
- **Access:** `SUPER_ADMIN` only

### Provision Security Officer
- **Endpoint:** `POST /api/v1/admin/officers`
- **Access:** `SUPER_ADMIN` only
- **Request Body:**
  ```json
  {
    "email": "officer.silva@uom.lk",
    "fullName": "Officer Silva",
    "password": "SecurePassword123",
    "badgeNumber": "BADGE-101"
  }
  ```

### List Security Officers
- **Endpoint:** `GET /api/v1/admin/officers`
- **Access:** `SUPER_ADMIN` only

---

## 3. Categories Management

### List Active Categories (Student/Public)
- **Endpoint:** `GET /api/v1/categories`
- **Access:** Public / Authenticated
- **Returns:** Only active categories sorted alphabetically by name.

### Manage Categories (Super Admin)
- **List All:** `GET /api/v1/admin/categories` (`SUPER_ADMIN`)
- **Create:** `POST /api/v1/admin/categories` (`SUPER_ADMIN`)
- **Update:** `PUT /api/v1/admin/categories/{id}` (`SUPER_ADMIN`)
- **Toggle Active:** `PATCH /api/v1/admin/categories/{id}/status?active={true|false}` (`SUPER_ADMIN`)
- *Note:* Soft deactivation is enforced; categories are never hard deleted to preserve referential integrity with future item records.

---

## 4. Campus Locations Management

### List Active Campus Locations (Student/Public)
- **Endpoint:** `GET /api/v1/locations`
- **Access:** Public / Authenticated
- **Returns:** Only active campus locations sorted alphabetically by name.

### Manage Campus Locations (Super Admin)
- **List All:** `GET /api/v1/admin/locations` (`SUPER_ADMIN`)
- **Create:** `POST /api/v1/admin/locations` (`SUPER_ADMIN`)
- **Update:** `PUT /api/v1/admin/locations/{id}` (`SUPER_ADMIN`)
- **Toggle Active:** `PATCH /api/v1/admin/locations/{id}/status?active={true|false}` (`SUPER_ADMIN`)
- *Note:* Soft deactivation is enforced; campus locations are never hard deleted to preserve referential integrity with future item records.
