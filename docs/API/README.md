# API Contract Documentation

This directory contains the documented REST API contracts for the CampusFind (Foundit) backend.

## Resource Families

- [Authentication & Identity](AUTH.md): Registration, email verification, login, password management, and user profiles.
- [Reference Data](REFERENCE_DATA.md): Public categories, locations, and security offices.
- [Found Items](FOUND_ITEMS.md): Found item reporting, public catalog, and officer handover.
- [Lost Reports](LOST_REPORTS.md): Private lost reports, student ownership, and officer search.
- [Claims & Verification](CLAIMS.md): Claim submission, private evidence handling, and officer approvals.
- [Physical Collection & Return](COLLECTION.md): Officer physical verification at security desks, return transitions, and reputation awards.
- [Notifications & Reminders](NOTIFICATIONS.md): In-app notifications, mock email dispatch, and scheduled escalation jobs.
- [Security Officer Operational APIs](OFFICER.md): Officer operational dashboard, inventory management, claim review, and collection history.
- [Super Admin Governance](ADMIN.md): User account governance, role assignment, reputation rules, and system configuration.
- [Audit Trail](AUDIT.md): Immutable audit logging and administrative audit inspection.

## Privacy & Security Guarantees

- **Anti-IDOR:** All student operations verify object ownership against the authenticated JWT principal.
- **Role Isolation:** Privileged administrative and officer routes are guarded with Spring Security method and URL authorization (`hasRole('SECURITY_OFFICER')`, `hasRole('SUPER_ADMIN')`).
- **Data Protection:** Claim evidence, Student ID images, and Index Numbers are strictly private and never exposed in public listings or student-facing endpoints.
