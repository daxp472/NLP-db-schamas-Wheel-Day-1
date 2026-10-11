# AGENTS.md — Global Development Instructions for AI Coding Agents

## Project Overview
**Schema Studio AI** is an AI-powered Database Schema & Entity-Relationship (ER) Diagram Studio that transforms natural language software requirements into validated, production-grade relational database schemas, interactive ER diagrams, deterministic SQL scripts, and documentation.

## Mandatory Rules for All AI Agents

1. **Read Before Modifying**:
   Before modifying any file or starting a new phase, AI agents MUST read:
   - `RULES.md` for mandatory engineering, security, and UI constraints.
   - `docs/IMPLEMENTATION_PLAN.md` for current phase, task statuses, and pending items.
   - Relevant spec documents in `docs/` (`ARCHITECTURE.md`, `API_SPEC.md`, `DATABASE_SCHEMA.md`, `AI_GENERATION.md`).

2. **Source of Truth**:
   - The Canonical Schema Model defined in `shared/src/types/schema.ts` is the single source of truth for both visual ER diagram state and SQL generation.
   - The ER Canvas must NEVER maintain independent diverging schema state.
   - Relational database schema semantics are kept separate from visual layout metadata (`layout` field).

3. **No Placeholders or Fake Success**:
   - Never implement empty mock buttons, nonfunctional dialogs, or fake success notifications.
   - Never mock backend responses in production mode; mock data is allowed strictly in isolated test fixtures or explicitly labeled demo templates.
   - Always verify feature behavior through builds, lints, and automated tests.

4. **Layered Validation**:
   - Never trust AI output.
   - Gemini responses must be constrained by JSON schemas, then validated deterministically with Zod, and then passed through database design semantic validation (circular references, composite PK validity, foreign key target existence and type compatibility).

5. **Security & Secrets**:
   - `GEMINI_API_KEY` and database credentials must remain on the backend only.
   - Protect all project endpoints with authentication and project ownership checks.
   - Parameterize and sanitize all inputs; never execute generated SQL automatically against production.

6. **Phased Progress Updates**:
   - Every completed phase must be tested and reflected in `docs/IMPLEMENTATION_PLAN.md` with verification notes before proceeding to the next phase.
