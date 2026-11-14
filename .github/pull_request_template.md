## Summary
<!-- Provide a brief description of what this PR introduces or changes -->

Closes #<!-- Issue number, e.g. 93 -->

---

## Type of Change
- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 🔨 Refactoring (no functional changes)
- [ ] 📝 Documentation update
- [ ] ⚙️ CI/CD or build pipeline change
- [ ] 🔒 Security improvement

---

## Key Changes
- <!-- Bullet points summarizing code changes -->

---

## Testing Performed
- [ ] Unit & Integration tests passing locally (`cd backend && ./mvnw clean verify`)
- [ ] All new logic accompanied by automated tests
- [ ] Flyway database migrations validated against clean database
- [ ] API endpoints verified with correct authorization status codes

**Test Summary:**
```
<!-- Paste test execution summary here -->
```

---

## Security Considerations
- [ ] Strict role-based authorization enforced (Spring Security / RBAC)
- [ ] No IDOR vulnerabilities; authenticated user context derived from Spring Security principal
- [ ] Sensitive student data (Index Numbers, Student ID images, private claim evidence) protected
- [ ] Input validation applied using Jakarta Bean Validation

---

## Secret & Environment Checklist
- [ ] No credentials, passwords, JWT secrets, or tokens committed
- [ ] No `.env` or sensitive local config files tracked in Git (`.gitignore` respected)
- [ ] `.env.example` updated with safe placeholder values if new environment variables were introduced

---

## Pre-Merge Checklist
- [ ] Code follows existing project conventions and architecture
- [ ] Documentation updated in `docs/` and `progress/STATUS.md` where appropriate
- [ ] Branch is rebased and up to date with `main`
- [ ] All CI status checks passing
