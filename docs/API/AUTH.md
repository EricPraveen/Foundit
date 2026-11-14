# Authentication & Access API Contract

Base path: `/api/v1/auth`

## 1. Register Account

- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Institutional Rule:** Accepts only exact `@uom.lk` email addresses. Subdomains (`@student.uom.lk`) and lookalikes are strictly rejected.
- **Role Assignment:** Automatically assigns `STUDENT` role. Privileged roles (`SECURITY_OFFICER`, `SUPER_ADMIN`) cannot be registered publicly.
- **Request Body:**
  ```json
  {
    "email": "student@uom.lk",
    "password": "SecurePassword123",
    "fullName": "Student Name"
  }
  ```
- **Responses:**
  - `201 Created`: `{"message": "Registration successful. Please check your @uom.lk inbox to verify your account."}`
  - `400 Bad Request`: Validation error or non-@uom.lk domain.
  - `409 Conflict`: Email already registered.

## 2. Verify Email

- **Endpoint:** `GET /api/v1/auth/verify-email?token={token}`
- **Access:** Public
- **Security:** Single-use token, expires after 24 hours, stored as SHA-256 hash.
- **Responses:**
  - `200 OK`: `{"message": "Email successfully verified! You may now log in to Foundit."}`
  - `400 Bad Request`: Invalid, expired, or reused token.

## 3. Resend Verification Link

- **Endpoint:** `POST /api/v1/auth/resend-verification`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "student@uom.lk"
  }
  ```
- **Responses:**
  - `200 OK`: `{"message": "If an unverified account exists for this email, a new verification link has been sent."}` (Timing-safe generic response).

## 4. Login

- **Endpoint:** `POST /api/v1/auth/login`
- **Access:** Public
- **Pre-conditions:** Email must be verified and account must be active.
- **Request Body:**
  ```json
  {
    "email": "student@uom.lk",
    "password": "SecurePassword123"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": 86400,
      "user": {
        "id": "c1f7a0b3-982e-4cb2-8071-8b2c28a8d114",
        "email": "student@uom.lk",
        "fullName": "Student Name",
        "role": "STUDENT"
      }
    }
    ```
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Email not verified or account suspended.

## 5. Current User Profile

- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Responses:**
  - `200 OK`: `{"id": "...", "email": "...", "fullName": "...", "role": "..."}`
  - `401 Unauthorized`: Missing or invalid JWT.

## 6. Role Authorization Rules

- Roles: `STUDENT`, `SECURITY_OFFICER`, `SUPER_ADMIN`
- Server-side enforcement with Spring Security `@PreAuthorize("hasRole('...')")`.
- `STUDENT` cannot access officer or admin endpoints.
- `SECURITY_OFFICER` can access officer-designated operations.
- `SUPER_ADMIN` can access administrative operations.
