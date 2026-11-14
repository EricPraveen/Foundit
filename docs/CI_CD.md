# Continuous Integration, Security Automation, and Pull Request Workflow

This document details the CI/CD pipeline, security automation, branching conventions, and quality gates for the **Foundit (CampusFind)** platform.

---

## 1. Git Branching and Contribution Strategy

Foundit follows a strict branch-and-PR development model:
- **`main` Branch:** Protected integration branch representing stable, verified code. Direct commits and direct pushes to `main` are strictly forbidden.
- **Dedicated Feature Branches:** All changes must originate from feature branches created from the latest `main`.
  - Backend features: `backend/backend-XX-<short-description>`
  - Operations / CI: `ops/ops-XX-<short-description>` or `feature/<short-description>`
  - Frontend features: `frontend/frontend-XX-<short-description>` (when Phase 3 begins)

### Workflow Steps

1. **Update and verify local `main`:**
   ```bash
   git checkout main
   git pull origin main
   git status
   ```
2. **Create a dedicated branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit with Conventional Commit messages:**
   ```bash
   git commit -m "feat(backend): implement user profile endpoints (#92)"
   ```
4. **Push to GitHub:**
   ```bash
   git push -u origin feature/your-feature-name
   ```
5. **Open a Pull Request:**
   ```bash
   gh pr create --base main --head feature/your-feature-name --title "feat(...): ..." --body "..."
   ```

---

## 2. GitHub Actions CI Pipeline Architecture

The CI pipeline runs automatically on all Pull Requests targeting `main` and on pushes to `main`.

Workflows are located under `.github/workflows/`:
1. **`ci.yml` (CampusFind CI):**
   - **Backend Build & Test (`backend-ci`):** Sets up JDK 21 (Temurin), caches Maven dependencies, and runs `./mvnw clean verify --batch-mode --no-transfer-progress`. Executes all unit and integration tests against an isolated in-memory test database. On test failure, Surefire test reports are archived and uploaded as artifacts.
   - **Frontend Build & Test (`frontend-ci`):** Inspects whether `frontend/package.json` exists. While frontend implementation is deferred to Phase 3 per `docs/ROADMAP.md`, the job automatically skips gracefully. Once initialized, it executes `npm ci`, linting, TypeScript type-checking, testing, and production build.
   - **Code Quality & Secrets Hygiene (`code-quality`):** Checks the Git index to ensure zero `.env` or credential files are tracked in version control, and verifies clean Java compilation with compiler warnings.
2. **`secret-scanning.yml` (GitGuardian Secret Scanning):**
   - Uses `GitGuardian/ggshield-action@v1` with full Git history (`fetch-depth: 0`) to detect leaked credentials, keys, or tokens in commits and PR diffs.

---

## 3. GitGuardian Integration Guide

Foundit uses **GitGuardian (ggshield)** for automated secret detection.

### A. Setting Up GitHub Actions Secret Scanning

1. Sign in to your [GitGuardian Dashboard](https://dashboard.gitguardian.com/).
2. Navigate to **API** or **Settings > API Tokens**.
3. Create a Personal Access Token or Service Account Token with `scan` permission.
4. Copy the generated token.
5. In your GitHub repository:
   - Go to **Settings > Secrets and variables > Actions**.
   - Click **New repository secret**.
   - Name: `GITGUARDIAN_API_KEY`
   - Value: `<paste your GitGuardian API token>`
   - Click **Add secret**.
6. Once configured, every PR and push to `main` will be automatically scanned by ggshield. Any hardcoded credentials will fail the CI check and block merging.

### B. Connecting the GitGuardian GitHub App (Recommended)

1. In GitGuardian dashboard, click **Integrations > GitHub**.
2. Install the **GitGuardian GitHub App**.
3. Under repository permissions, select **Only select repositories** and pick `EricPraveen/Foundit`.
4. Verify that the repository status appears as **Monitored** on the dashboard.

### C. Local Pre-Commit Secret Scanning (macOS Setup)

To prevent secrets from ever leaving your machine:

1. **Install ggshield via Homebrew:**
   ```bash
   brew install gitguardian/tap/ggshield
   ```
2. **Authenticate with GitGuardian:**
   ```bash
   ggshield auth login
   ```
3. **Install pre-commit hook in the repository:**
   ```bash
   cd /path/to/Foundit
   ggshield install --mode=local
   ```
4. Now, `git commit` will automatically scan staged changes before committing.

---

## 4. Dependabot Configuration

Dependabot is configured via `.github/dependabot.yml` to automatically monitor dependencies and security advisories:
- **Spring Boot / Maven (`/backend`):** Weekly scans every Monday at 04:00 Asia/Colombo. Dependencies are grouped into `spring-dependencies` and `test-frameworks` to prevent PR spam.
- **Node / npm (`/frontend`):** Weekly scans every Monday for React dependencies once initialized.
- **GitHub Actions (`/`):** Monthly scans for workflow actions.

---

## 5. Branch Protection Rules on `main`

To maintain production stability, branch protection must be enabled on `main`.

### Requirements
- Require Pull Requests before merging (direct pushes blocked).
- Require status checks to pass before merging:
  - `Backend Build & Test Validation`
  - `Frontend Build & Test Validation`
  - `Code Quality & Secrets Hygiene`
  - `GitGuardian ggshield Secret Scan` (when API key is configured)
- Require branches to be up to date before merging (`strict` check).
- Prevent force pushes (`allow_force_pushes: false`).
- Prevent branch deletion (`allow_deletions: false`).

### Manual Setup via GitHub Web UI (if needed)
1. Go to repository **Settings > Branches**.
2. Click **Add branch protection rule** (or edit rule for `main`).
3. Branch name pattern: `main`.
4. Check **Require a pull request before merging**.
5. Check **Require status checks to pass before merging** and select:
   - `Backend Build & Test Validation`
   - `Code Quality & Secrets Hygiene`
6. Check **Require branches to be up to date before merging**.
7. Ensure **Do not allow bypassing the above settings** or admin enforcement is configured as desired.
8. Click **Save changes**.

---

## 6. How to Resolve Merge Conflicts

If a PR cannot be merged due to conflicts:
1. **Fetch latest changes from origin:**
   ```bash
   git fetch origin
   ```
2. **Check out your feature branch:**
   ```bash
   git checkout feature/your-feature-name
   ```
3. **Rebase or merge from `origin/main`:**
   ```bash
   git merge origin/main
   # OR: git rebase origin/main
   ```
4. **Inspect and resolve conflicted files:**
   ```bash
   git status
   # Edit files to resolve conflict markers (<<<<<<<, =======, >>>>>>>)
   ```
5. **Verify the build and tests pass:**
   ```bash
   cd backend && ./mvnw clean verify
   ```
6. **Commit and push the resolved changes:**
   ```bash
   git add <resolved-files>
   git commit -m "chore: resolve merge conflicts with main"
   git push origin feature/your-feature-name
   ```
   GitHub Actions will re-run CI checks automatically on the updated PR.
