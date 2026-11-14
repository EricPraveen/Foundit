# Security and privacy requirements

- Verify university email ownership with a single-use, expiring email link. Email verification does not establish student identity.
- Enforce role authorization and record ownership checks on the server for every endpoint.
- Lost report data is not available to other students.
- Claim Student ID, Index Number, and ownership proof are sensitive; only authorized Security Officers may access them.
- Do not expose sensitive data through logs, analytics, public URLs, notifications, or error messages.
- Use private file storage and short-lived authorized access where appropriate; provider and retention policy remain open.
- Keep secrets in environment/secret management, never committed files.
- Audit receipt, verification, claim decision, collection, points, and unclaimed escalation actions.
- Apply secure password handling, rate limits for authentication, input validation, and CSRF/session protections appropriate to the chosen auth design.
