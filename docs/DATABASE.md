# Database design notes

This is a domain inventory, not a finalized ERD or migration specification. Confirm unresolved rules before locking constraints.

## Candidate tables

- `users`, `student_profiles`, `security_profiles`
- `categories`, `locations`
- `lost_reports`, `found_items`, `item_images`
- `claims`, `claim_evidence`
- `point_transactions`
- `notifications`, `audit_logs`, `item_status_history`
- `email_verifications`; `refresh_tokens` only if selected
- `system_settings` for approved configurable policy values

## Invariants to preserve

- Lost and found reports are independent.
- A found item records its finder; physical receipt records receiving officer and time.
- One found item may have multiple claims.
- Claim evidence is private and officer-authorized only.
- Every points award has a ledger entry and cannot be duplicated by retries.
- Important custody/claim/status decisions have actor and timestamp history.
- Use explicit status enums and documented allowed transitions.

## Before schema freeze

Create ERD, define deletion/retention strategy, uniqueness rules, indexes, file metadata model, and state transitions. Do not store uploaded binaries directly in relational rows unless specifically justified; storage provider is undecided.
