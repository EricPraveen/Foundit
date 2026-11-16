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
  - `/verify-email`: Token verification flow
  - `/unauthorized`: 403 Forbidden access denial page
- **Protected Student Application Routes (`ProtectedRoute`):**
  - `/dashboard`: Student dashboard overview
  - `/found-items`: Found items catalog
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

## API Client & Backend Contract

The API client in `src/lib/api/apiClient.ts` provides:

- **JWT Interceptor:** Automatically adds `Authorization: Bearer <token>` when a token exists in `tokenStorage`.
- **Error Mapping:** Converts backend `ErrorResponse` objects into typed `ApiError` instances matching Spring Boot validation schemas.
- **Auto-Logout on 401:** Automatically triggers session cleanup and redirects to login when an unauthorized response is received.
- **Multipart Upload Support:** Supports file uploads (`apiClient.upload<T>(url, formData)`) for found item photos, Student ID cards, and ownership proof documents.
