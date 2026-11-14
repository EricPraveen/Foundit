# Project context

## Purpose

CampusFind helps university students report lost items, report items they found, hand items to a central Security Office, and claim items after officer-led ownership verification. Security Officers manage physical custody and decisions; Super Admins manage configuration and escalations.

## Roles

- **Student:** registers with a university email, submits lost/found reports, submits claims, receives notifications, and views own points.
- **Security Officer:** works in the single central Security Office (multiple officers), confirms receipt, reviews claims and sensitive evidence, confirms collection, and handles unclaimed reminders.
- **Super Admin:** administers users/configuration and receives unclaimed-item escalations.

## Confirmed workflow rules

1. Lost reports and found reports are independent. Either can happen first; a lost report is not required before a found report.
2. A student must create a found report before physically handing the item in. An officer cannot create the student's found report in the MVP. This preserves finder attribution and points.
3. A found report triggers a handover reminder every 24 hours until handover is confirmed. There is no fixed deadline.
4. Only after physical receipt and officer verification can the found item become available in student-facing listings. Award category-based points after verified physical handover.
5. Lost reports are not visible to other students; Security Officers can access them. Student owner access to their own report should be implemented, subject to the detailed authorization contract.
6. Claims require University Student ID card, Index Number, and item ownership proof. Only Security Officers may see these sensitive materials.
7. Multiple claims may exist for one item. A Security Officer determines the rightful owner. A rejected claimant may submit again with new evidence.
8. Approved claims move to collection; an officer confirms physical collection before the item is marked returned/completed.
9. Notifications are mobile-first/in-app (browser push is a proposed PWA capability); important events also use email. In-app notifications should remain available if push is denied.
10. Unclaimed items remain physically stored. After a configurable period, notify the officer, mark UNCLAIMED, and escalate to Super Admin. Final action follows university policy; the system must not dispose of or transfer the item automatically.

## Development sequence

Backend first: database, business logic, authentication/authorization, validation, privacy, notifications, tests, and stable API documentation. Frontend begins only after the backend gate is completed. Then integrate and deploy.

## Assumptions requiring confirmation

See `OPEN_QUESTIONS.md`; examples in earlier discussion (point values, hosting providers, deployment platforms) were illustrative only and are not commitments.
