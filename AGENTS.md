# Instructions for coding agents

- Treat `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md`, and `docs/OPEN_QUESTIONS.md` as the source of truth. The referenced conversation is context, not a request to invent missing policy.
- Preserve the backend-first sequence. Do not implement frontend product flows until the backend completion criteria in `docs/ROADMAP.md` are satisfied and recorded.
- Resolve open questions by documenting options and asking the project owner where a decision changes policy, privacy, user experience, cost, or deployment. Do not silently turn assumptions into requirements.
- Keep lost reports and found reports independent. Either may be created first. Never expose lost-report data to students or include it in public listing APIs.
- Claim evidence, Student ID images, and Index Numbers are sensitive. Restrict them to authorized Security Officers and protect them in storage, logs, exports, and API responses.
- Security Officers verify physical receipt, claims, and collection. Do not automatically award ownership or dispose of items.
- Use migrations for schema changes. Never rely on Hibernate schema generation in production.
- Add/update tests for implemented behavior when the project reaches implementation; do not claim a feature is complete without evidence.
- Keep API behavior documented in `docs/API/` and update `progress/STATUS.md` and `TASKS.md` as milestones change.
- Keep secrets out of source control. Use `.env.example` with placeholder values only.
