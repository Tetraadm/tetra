# Decisions (ADR-light)

Skriv kun når noe er et reelt valg (som påvirker arkitektur, sikkerhet, datamodell, auth-flow, AI-strategi).

---

## 2026-01-12: AI Workflow Structure
**Context:** Need a way to maintain context between AI chat sessions.
**Decision:** Use a file-based memory system in `docs/ai/` with specific roles for Claude (Architect) and Codex (Executor).
**Why:** Prevents circular conversations and ensures verification before code is finalized.
**Consequences / tradeoffs:** Requires discipline to update files, but saves time on debugging and re-explaining context.
**Follow-ups:** Evaluate effectiveness after 1 week.
