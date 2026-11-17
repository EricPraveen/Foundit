# CampusFind Frontend

CampusFind is the web platform for the University of Moratuwa Lost and Found system, serving students, Central Security Officers, and Super Administrators.

This application is built with **React 18**, **TypeScript** (Strict Mode), **Vite**, **Tailwind CSS**, and **React Router v6**.

---

## Getting Started

### Prerequisites

- **Node.js**: v20+ (v20 LTS or later recommended)
- **npm**: v10+

### Environment Configuration

Copy the example environment configuration file to `.env`:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api/v1` | Base URL of the Spring Boot backend REST API |
| `VITE_APP_NAME` | `CampusFind` | Application display name |
| `VITE_CAMPUS_DOMAIN` | `@uom.lk` | Institutional student domain validation indicator |

> **Note:** Never commit real secrets or `.env` files to source control. Only safe variables prefixed with `VITE_` are bundled into the client build.

### Installation

```bash
cd frontend
npm ci
```

### Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`. CORS is pre-configured on the Spring Boot backend for `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

### Testing and Code Hygiene

```bash
# Run unit and integration tests (Vitest)
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Run TypeScript strict type-checking
npm run typecheck

# Run ESLint validation
npm run lint
```

---

## Architecture & Folder Structure

```
frontend/
├── public/                     # Static assets and favicon
├── src/
│   ├── app/                    # Root application component & centralized router
│   │   ├── App.tsx             # Root error boundary, auth provider, router provider
│   │   └── router.tsx          # Centralized route definitions with lazy-loaded pages
│   ├── components/
│   │   ├── common/             # Cross-cutting UI wrappers (ErrorBoundary)
│   │   ├── layout/             # Layout primitives
│   │   └── ui/                 # Reusable UI primitives (Button, Input, Card, Badge, etc.)
│   ├── features/               # Feature-specific modules
│   │   ├── auth/               # AuthContext, AuthProvider, useAuth hook
│   │   ├── dashboard/          # Student dashboard components (later issues)
│   │   ├── found-items/        # Found items catalog & reporting (later issues)
│   │   ├── lost-reports/       # Private lost report flows (later issues)
│   │   ├── claims/             # Claim submission & evidence handling (later issues)
│   │   ├── notifications/      # Notification feed & alerts (later issues)
│   │   └── profile/            # User profile & reputation ledger (later issues)
│   ├── layouts/                # Application layouts
│   │   ├── PublicLayout.tsx    # Header, public navigation & footer
│   │   ├── AuthenticatedLayout.tsx # Role-aware sidebar, navbar & main content
│   │   ├── Sidebar.tsx         # Responsive sidebar with Student/Officer/Admin navigation
│   │   └── Header.tsx          # Top navbar with user info & logout
│   ├── lib/
│   │   ├── api/                # Centralized Axios client, interceptors, ApiError, token storage
│   │   └── utils/              # Utilities (cn class merger)
│   ├── pages/                  # Page-level components
│   │   ├── public/             # HomePage, LoginPage, RegisterPage, VerifyEmailPage, etc.
│   │   ├── app/                # Authenticated student pages (Dashboard, FoundItems, Claims, etc.)
│   │   ├── officer/            # Security Officer operational consoles
│   │   └── admin/              # Super Admin management consoles
│   ├── routes/                 # Route paths & guards
│   │   ├── paths.ts            # Centralized route constants
│   │   └── guards/             # ProtectedRoute & RoleRoute guards
│   ├── styles/                 # Global styles & Tailwind entry
│   │   └── globals.css
│   ├── test/                   # Test setup and test suites
│   └── types/                  # TypeScript definitions (auth, api, spring page DTOs)
├── .env.example                # Example environment variables
├── eslint.config.js            # ESLint 9 configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies and npm scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS theme and color tokens
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite bundler & Vitest test runner configuration
```

---

## Routing & Route Guards

All routes are declared in `src/routes/paths.ts`:

- **Public Routes:**
  - `/`: Public landing page and catalogue preview
  - `/login`: University login portal
  - `/register`: Student `@uom.lk` registration
  - `/verify-email`: Token verification and resend flow
  - `/forgot-password`: Password recovery notice and institutional support desk
  - `/unauthorized`: 403 Forbidden access denial page
- **Protected Student Application Routes (`ProtectedRoute`):**
  - `/dashboard`: Student dashboard overview
  - `/found-items`: Found items catalog & reporting registry
  - `/found-items/:id`: Found item detail view
  - `/lost-reports`: Private lost reports
  - `/claims`: Ownership claim history
  - `/notifications`: In-app notifications
  - `/profile`: Profile and reputation point ledger
- **Security Officer Routes (`RoleRoute: SECURITY_OFFICER, SUPER_ADMIN`):**
  - `/officer/dashboard`: Central Security Office operational desk
  - `/officer/found-items`: Custody inventory management
  - `/officer/claims`: Ownership claim review desk
  - `/officer/handovers`: Physical handover verification & reminders
- **Super Admin Routes (`RoleRoute: SUPER_ADMIN`):**
  - `/admin/dashboard`: System administration overview
  - `/admin/users`: User governance and role assignment
  - `/admin/reputation-rules`: Category reputation reward administration
  - `/admin/audit-logs`: Append-only immutable audit trail inspection
  - `/admin/system-config`: System environment and operational settings
- **Catch-all (`*`):**
  - 404 Not Found error page

---

## Authentication & Identity Implementation (FRONTEND-02)

The application implements student authentication integrated with the Spring Boot backend REST API:

### 1. Registration (`/register`)
- **Institutional Email Policy:** Strictly enforces exact `@uom.lk` domain validation (subdomains like `@student.uom.lk` and external providers like `@gmail.com` are rejected).
- **Backend Endpoint:** `POST /api/v1/auth/register` (`{ email, password, fullName }`).
- **Post-Registration State:** Upon `201 Created`, the user is presented with a clear verification prompt directing them to check their university inbox. Automatic login is prevented until the email address is verified.

### 2. Email Verification (`/verify-email`)
- **Query Parameter Resolution:** Parses `?token={token}` directly from email verification links and submits to `GET /api/v1/auth/verify-email?token={token}`.
- **States:** Interactive loading indicator during verification, success confirmation with direct login redirect, and comprehensive error display for expired or reused single-use tokens.
- **Resend Verification:** Integrated resend flow calling `POST /api/v1/auth/resend-verification` (`{ email }`), displaying timing-safe generic messages to prevent account enumeration.

### 3. Login (`/login`)
- **Backend Endpoint:** `POST /api/v1/auth/login` (`{ email, password }`).
- **Error Handling:** Formatted feedback for `401 Unauthorized` (invalid credentials) and `403 Forbidden` (unverified email with direct verification navigation, and deactivated/suspended account alerts).
- **Session Hydration:** Stores JWT in `tokenStorage`, hydrates `user` object in `AuthProvider`, and auto-refreshes profile via `GET /api/v1/auth/me`.
- **Role-Based Redirection:**
  - `STUDENT` &rarr; `/dashboard`
  - `SECURITY_OFFICER` &rarr; `/officer/dashboard`
  - `SUPER_ADMIN` &rarr; `/admin/dashboard`
  - Respects original location redirects (`location.state.from`) when accessing protected resources.

### 4. Password Recovery Status (`/forgot-password`)
- **Backend Status:** Automated password reset endpoints (`/forgot-password`, `/reset-password`) are not yet implemented in the Spring Boot backend.
- **Policy Compliance:** The frontend does not simulate fake email dispatch or mock successful password changes. The dedicated `/forgot-password` view provides transparent guidance directing students to the Central Security Office or System Administrator for physical verification and credential recovery.

---

## API Client & Backend Contract

The API client in `src/lib/api/apiClient.ts` provides:

- **JWT Interceptor:** Automatically adds `Authorization: Bearer <token>` when a token exists in `tokenStorage`.
- **Error Mapping:** Converts backend `ErrorResponse` objects into typed `ApiError` instances matching Spring Boot validation schemas.
- **Auto-Logout on 401:** Automatically triggers session cleanup and redirects to login when an unauthorized response is received.
- **Multipart Upload Support:** Supports file uploads (`apiClient.upload<T>(url, formData)`) for found item photos, Student ID cards, and ownership proof documents.

---

## Student Dashboard & Profile Implementation (FRONTEND-03)

The student overview and identity interfaces are fully integrated with real Spring Boot backend endpoints:

### 1. Student Dashboard (`/dashboard`)
- **Authentic Summary Statistics:**
  - **Reputation Balance:** Sourced from `GET /api/v1/users/me/reputation` (`currentBalance` and `totalEarned`).
  - **My Found Reports:** Sourced directly from Spring Data Page `totalElements` via `GET /api/v1/found-items/me`.
  - **My Lost Reports:** Sourced directly from Spring Data Page `totalElements` via `GET /api/v1/lost-reports`.
  - **My Claims:** Sourced directly from Spring Data Page `totalElements` via `GET /api/v1/claims/me`.
  - **Zero Fabrication:** If an endpoint returns 0, a genuine `0` count is displayed. No unsupported metrics (such as separate "Active Lost Reports" or "Pending Claims" totals) are fabricated.
- **Recent Student Activity:** Displays authorized recent lost reports, found items, claims, and reputation awards with category names, locations, timestamps, and authentic status badges. Includes tab-based filtering (`All`, `Lost`, `Found`, `Claims`, `Points`).
- **Quick Action Links:** Direct routing to Browse Found Items, Report Lost Item, Report Found Item, My Claims, and Profile & Reputation.
- **Campus Reference Directory:** Toggleable integrated views for Lost & Found Categories and Campus Locations.
- **Resilience:** Queries are dispatched in parallel via `Promise.allSettled`; partial network or service failures in one section do not crash or blank out unrelated sections.

### 2. Student Profile & Privacy (`/profile`)
- **Profile Display:** Displays safe fields: Full Name, University Email (`@uom.lk`), Phone Number, Account Status badge (`ACTIVE`), Assigned Role badge (`STUDENT`), Email Verification status, and Account Creation date.
- **Strict Privacy Invariant:** Student Index Number (`indexNumber`) and `indexNumberVerified` are strictly protected and **never displayed** in the student-facing UI.
- **Profile Editing:** Toggles edit mode for permitted editable fields: `fullName` (required, max 150 chars) and `phoneNumber` (optional, max 30 chars). Submits updates to `PUT /api/v1/users/me` and synchronizes `AuthProvider` state so navigation headers immediately update.
- **Protected Fields:** Institutional Email and Assigned Role are clearly flagged with `Read-only` and `System Assigned` badges and cannot be modified.
- **Reputation Points Ledger:** Queries `GET /api/v1/users/me/reputation` and `GET /api/v1/users/me/reputation/transactions`. Displays verified points balance, lifetime points earned, and an auditable transaction history showing transaction types (`Handover Reward`, `Collection Reward`, `Admin Adjustment`), awarded points (`+X pts`), descriptions, and dates.

### 3. Categories & Campus Locations Reference Data
- **Active Categories (`/categories`):** Loaded via `GET /api/v1/categories`. Displays verified lost and found item classifications in alphabetical order with search filtering and error retry.
- **Campus Locations (`/locations`):** Loaded via `GET /api/v1/locations`. Displays official campus facilities and custody zones (Academic Complex, Administration, Recreation) with zone filter buttons and search filtering.
- **Reusable Data Hooks:** Exported `useCategories()` and `useLocations()` provide cached in-memory reference data for reporting and claim submission forms.

---

## Found Item Reporting & Public Browser (FRONTEND-04)

The found item reporting, custody verification, and catalog discovery workflows are fully implemented according to Spring Boot backend contracts:

### 1. Found Item Reporting (`POST /api/v1/found-items`)
- **Reporting Modal:** Interactive form with client validations:
  - Title: 3–200 characters, required.
  - Category: Selection from active categories via `useCategories()`.
  - Location: Selection from active campus locations via `useLocations()`.
  - Specific Location: Optional floor/room/bench details (max 255 chars).
  - Found Timestamp: `<input type="datetime-local">`, validated past or present (future timestamps rejected).
  - Description: 5–2000 characters, required.
  - Designated Security Office: Automatically fetched via `useSecurityOffice()` from `GET /api/v1/security-office` (Moratuwa MVP Central Security Office).
- **Image Upload Integration:** Multi-file drag-and-drop selector:
  - Supports JPEG, PNG, and WebP formats.
  - Enforces maximum file size limit of 5 MB per image.
  - Enforces maximum item attachment limit of 5 images.
  - Client-side thumbnail previews with remove button prior to upload.
  - Sequential upload via `POST /api/v1/found-items/{id}/images` upon successful report creation.
- **Double Submission Prevention:** Disables submit buttons and provides loading indicators during submission and image uploading.
- **Success & Handover Instructions Screen:** Displays immediate next steps with reference title/ID, designated Central Security Office desk location, operating hours, and custody verification guidelines.

### 2. Handover Guidance & Security Invariants
- **Privacy Invariant:** Found reports start in `PENDING_HANDOVER` (handover status `PENDING`, availability `UNAVAILABLE`). Unconfirmed reports are strictly private to the finder and **excluded from the public catalog**.
- **Physical Custody Verification:** The finder must bring the physical item to the designated Central Security Office desk.
- **Officer-Only Verification:** Only an authorized Security Officer can verify physical receipt (`POST /api/v1/officer/found-items/{id}/confirm-handover`). Upon officer verification:
  - Handover status transitions to `CONFIRMED`.
  - Availability status transitions to `AVAILABLE`.
  - Reputation points are awarded to the finder.
  - Item becomes discoverable in the university-wide catalog.
- **No Self-Verification:** Students cannot self-verify handovers or publish items without physical inspection by officers.

### 3. Finder Report Management (`GET /api/v1/found-items/me`)
- **Status Filtering:** Tab-based views for `All`, `Pending Handover`, `Verified & Handed Over`, and `Cancelled`.
- **Pending Updates (`PUT /api/v1/found-items/{id}`):** Finder can edit title, description, category, location, and specific location while the report remains in `PENDING` status.
- **Pending Cancellation (`POST /api/v1/found-items/{id}/cancel`):** Finder can cancel a pending report with confirmation before physical handover. Cancelled items are locked against further editing.
- **Image Attachments:** Finder can add photos (up to 5 total) or delete individual photos (`DELETE /api/v1/found-items/{id}/images/{imageId}`) while in `PENDING` status.
- **Officer Notes:** Displays officer verification notes on confirmed items.

### 4. Available Items Catalog Browser (`GET /api/v1/found-items`)
- **Public & Authenticated Discovery:** Displays verified `AVAILABLE` items held at the Central Security Office.
- **Server-Side Filters:**
  - Search keyword matching on title and description (`query`).
  - Category dropdown filter (`categoryId`).
  - Campus Location dropdown filter (`locationId`).
  - Date range filters (`fromDate`, `toDate`).
  - Sort order (`foundAt,desc`, `foundAt,asc`, `createdAt,desc`, `title,asc`).
  - Reset filters action.
- **Spring Data Pagination:** Responsive page navigation (Page X of Y, Previous / Next controls, total items indicator).
- **Finder Privacy Masking:** Public catalog cards and summary responses completely omit finder personal identifiers. Non-owner item detail views mask finder names.
- **Item Details View (`/found-items/:id` and Modal):** Comprehensive item view with photo gallery, location, timestamp, custody office details, and claimant instructions.


