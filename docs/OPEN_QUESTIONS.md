# Open questions and assumptions

These details were not resolved in the referenced conversation. Keep them visible and ask the project owner before choices become policy or costly infrastructure.

## Needed before relevant implementation

- **Index Number validation:** trusted university data integration, manual officer check, or another process? Email domain verification alone does not verify student identity.
- **Unclaimed period:** what configurable duration triggers reminder/status/escalation?
- **Retention and privacy:** retention/deletion rules for student ID images, claim evidence, closed reports, and audit logs; who can view a student's own lost report?
- **Category taxonomy and point values:** defined configurable category rules in `category_reputation_rules` table and `application.yml` for `FOUND_ITEM_HANDOVER` and `ITEM_COLLECTION`. Confirm production point values, whether points apply retroactively, and who may change them.
- **Notification channels:** are browser push notifications in MVP, or later? Which events count as important enough for email?
- **Images/files:** storage provider, size/type limits, malware scanning, and retention. Supabase Storage was mentioned as a possible example, not selected.
- **Authentication details:** JWT/session approach, refresh tokens, password policy, email provider, token expiry, and account recovery rules.
- **Security Office operations:** receipt workflow, office hours/contact details, officer assignment, and escalation recipients.
- **Claim lifecycle edge cases:** can a student claim their own found item? Can an approved claim be revoked? Is there a collection window?
- **Lost report fields and matching:** explicit linking between claims/collection and lost reports supported via `linkedLostReportId` transitioning reports to `RECOVERED`. Automated fuzzy/smart matching remains out of scope for MVP.
- **Deployment:** hosting platform, domain, environments, backups, monitoring, and cost limits.
- **MVP scope:** leaderboard, achievements, analytics, PWA/offline support were proposed; confirm whether required or later.

## Safe implementation assumptions

- Enforce privacy by default; expose only minimum necessary fields in student-facing APIs.
- Use configurable values for unclaimed duration and points, but do not pick production values without approval.
- Keep file storage behind an interface so a provider can be selected later.
- Make scheduling idempotent and auditable; avoid duplicate reminders/points.
