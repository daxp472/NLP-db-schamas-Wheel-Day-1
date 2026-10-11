# RULES.md — Engineering, Security, UI & Implementation Rules

## 1. Engineering Principles
- **TypeScript Strictness**: Frontend, backend, and shared libraries must have `strict: true` in `tsconfig.json`. No `any` types unless strictly necessary for external untyped libraries (and even then, properly wrapped).
- **Canonical Schema Single Source of Truth**: All visual elements (nodes, edges, inspectors) and export artifacts (PostgreSQL DDL, JSON, Markdown) are computed deterministically from the canonical schema model.
- **Fail Loud & Early**: All invalid states must produce actionable, visible diagnostic errors or warnings. Never swallow caught exceptions without logging or surfacing user context.
- **Reversible Decisions**: Design modular adapters for database dialects (PostgreSQL dialect first, extensible to MySQL/SQLite/MongoDB) and AI providers.

## 2. UI/UX Rules: Professional Database Engineering Workbench
- **No SaaS Clichés**: Avoid repetitive rounded candy cards, glowing purple gradients, empty oversized hero sections, emoji nav items, or fake terminal spinners.
- **Visual Aesthetic**:
  - Dark graphite palette as default (`#0B0D13` base, `#141722` surfaces, `#1F2437` borders, `#2A324B` active).
  - High contrast readability, sharp 4px/6px radii, precise 1px micro-borders.
  - Distinctive technical accents: Electric Cyan (`#00D2FF` / `#0EA5E9`), Amber warning (`#F59E0B`), Emerald valid (`#10B981`), Crimson error (`#EF4444`), Violet foreign key badge (`#8B5CF6`).
  - Font: JetBrains Mono / Inter / Geist Mono for technical density and crisp alignment.
- **State Feedback**:
  - Distinct indicators for Primary Key (PK 🔑), Foreign Key (FK 🔗), Unique (UQ), Indexed (IDX), Nullable (NULL).
  - Explicit saved, unsaved, saving, and dirty state indicators in toolbar.
  - Undo/Redo stack for canvas and schema mutations.
  - Interactive minimap, zoom-to-fit, snap-to-grid, and auto-layout (hierarchical / DAG layout).

## 3. Security Rules
- **Backend Only Gemini Access**: `GEMINI_API_KEY` is loaded strictly server-side. Frontend accesses AI only via authenticated Express endpoints.
- **Zero Raw Injection**: Prompt injection defenses: sanitize user text, treat user requirements purely as data in system-delimited blocks, reject adversarial system-override prompts.
- **Ownership Verification**: Every query accessing or mutating a project (`/api/projects/:id/*`) must verify that `project.userId === authenticatedUser.id`.
- **Safe SQL Export**: Generated SQL must escape identifiers properly (`"table_name"`, `"column_name"`), never execute automatically, and clearly prompt user before download/copy.
- **Authentication**: Salted bcrypt hashing (cost >= 12), signed JWT tokens with standard expiration, sanitized auth responses (passwords never returned).

## 4. AI Generation & Schema Validation Rules
- **Contract Schema**: Gemini 2.5/Flash model receives structured JSON schema constraint (`responseMimeType: "application/json"`, `responseSchema`).
- **3-Tier AI Output Validation**:
  1. JSON parsing & Zod schema validation.
  2. Semantic database integrity validation:
     - Every foreign key target entity and column must exist.
     - Referenced column types must be compatible with foreign key types.
     - Entity and attribute names must be unique within scope.
     - Primary keys must not be nullable.
     - Junction tables in M:N must feature composite PKs or unique pair constraints.
  3. Bounded automatic repair (max 1 retry loop with targeted error feedback) before graceful error presentation.
- **No Hallucinated Rules**: AI must explicitly list its "Assumptions" and "Unresolved Questions" in the canonical schema structure for human review and resolution.
