# Confirmed decisions

| Topic | Decision |
|---|---|
| Repository | Monorepo containing backend, frontend, and shared documentation |
| Backend-first | Complete and test backend, stabilize API, then begin frontend |
| Backend stack | Java 21, Spring Boot, PostgreSQL, Spring Security; Maven, JPA, Flyway, OpenAPI were included in the agreed plan |
| Frontend stack | React + TypeScript + Vite + Tailwind; supporting libraries listed in project context/README |
| Student registration | Accept university `@uom.lk` email and send verification link; email verification is not proof of student identity |
| Found report | Student submits report before handover; officer does not submit on student's behalf in MVP |
| Handover reminders | Every 24 hours while pending; no fixed deadline |
| Lost report privacy | Security Officers only, not other students; owner access needs precise API rule |
| Claims | Student ID card + Index Number + ownership proof required; evidence visible only to Security Officers |
| Multiple claims | Officer chooses rightful owner; rejected claim can be resubmitted with new evidence |
| Security office | One central office with multiple Security Officers |
| Points | Category-based; examples are not final values; award after verified physical handover |
| Notifications | Mobile-first/in-app; important notices by email; browser push is a planned option, not a finalized requirement |
| Unclaimed items | Reminder, UNCLAIMED status, Super Admin escalation; final handling follows university policy; no automatic disposal |
| Report independence | Lost and found reports are separate and either may be filed first |

Do not add undocumented decisions to this table. Record new owner-approved decisions here and update dependent docs.
