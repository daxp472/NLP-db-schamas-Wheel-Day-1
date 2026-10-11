# PRODUCT_SPEC.md — Product Specification: Schema Studio AI

## 1. Product Vision
**Schema Studio AI** is an intelligent, developer-first Database Engineering Workbench that translates natural-language software specifications into production-grade database designs, interactive Entity-Relationship (ER) diagrams, PostgreSQL DDL scripts, and technical documentation.

Unlike generic chatbots or static canvas tools, Schema Studio AI validates every design rule deterministically, bridges the gap between high-level human requirements and strict relational schema semantics, and provides a continuous visual-and-code synchronization workflow.

## 2. Target Personas
- **Software Architects & Lead Engineers**: Rapidly prototyped data models from client PRDs and RFCs with automatic relational constraints and dependency ordering.
- **Backend Developers**: Converting domain logic into clean PostgreSQL tables, indexes, composite keys, and migrations.
- **Product Managers & Technical Analysts**: Visualizing domain boundaries, entity interactions, and identifying missing business rules early.
- **CS Students & Junior Developers**: Learning relational database design best practices, normalization, and foreign key cascades.

## 3. Core Capabilities & Workflows

### 3.1. Landing Page & Product Demonstration
- Crisp technical value proposition: "Natural Language Requirements to Production-Grade Database Schemas".
- Live interactive ER diagram preview demo directly on the landing page (no sign-up required to test the canvas).
- Real example showcase: E-Commerce Multi-Vendor, Healthcare Patient Portal, SaaS Multi-Tenant Billing.
- Direct CTA: "Launch Studio" / "Explore Sample Project".

### 3.2. Project Management Dashboard
- Create, rename, duplicate, archive, and delete projects.
- Recent projects grid/list with target database dialect badges (PostgreSQL default), table count, relationship count, and last-modified timestamps.
- Search and filter by dialect and tags.
- Demo templates launcher for one-click instant sandbox exploration.

### 3.3. Requirement Creation Workspace
- Multi-step structured input:
  - Application Name and Target Dialect (PostgreSQL first).
  - Natural Language Core Description (with character counter, guidance guidelines, and example quick-inserts).
  - Optional Structured Nuances: Known entities, compliance/audit rules, expected scale, auth model, soft delete preferences.
- Pre-submission validation: Length check, relevance check, and summary review before token dispatch.

### 3.4. Schema Studio Multi-Panel Workbench
- **Top Toolbar**:
  - Project Title & Live Persistence Status (Saved, Saving, Unsaved Changes).
  - Dialect Switcher (PostgreSQL).
  - Action Controls: Undo, Redo, Auto-Layout, Validate Schema, Export SQL, Export Diagram (PNG/SVG), Export JSON.
- **Left Panel (Schema Explorer)**:
  - Searchable list of entities/tables.
  - Quick statistics (column count, PK/FK badges).
  - "Add Table" button with instant canvas focus.
  - Module grouping / tags.
- **Center Canvas (Interactive ER Diagram)**:
  - Built with `@xyflow/react` (React Flow).
  - Custom Entity Nodes: Header with table name, typed column list, visual PK/FK/UQ/Null indicators.
  - Interactive handles connecting Source FK to Target PK.
  - Relationship labels showing cardinality (1:1, 1:N, N:M) and optionality.
  - Full canvas tools: Zoom in/out, fit view, minimap, drag-and-drop table repositioning.
  - Auto-layout engine (hierarchical DAG layout computing non-overlapping node positions).
- **Right Panel (Entity & Relationship Inspector)**:
  - Selected Entity detail: Rename table, edit comments/description.
  - Column editor: Name, SQL data type, isPrimaryKey, isForeignKey, isNullable, isUnique, defaultValue, checkExpression, comment.
  - Add/remove columns with instantaneous canvas and schema sync.
  - Relationship Inspector: Edit cardinality, onUpdate, onDelete cascades.
  - Inferred Design Rationale: Shows AI-generated justifications, unresolved questions, and explicit assumptions.
- **Bottom Drawer (Diagnostics & SQL Code)**:
  - Tab 1: **Validation & Diagnostics**: Hard errors, warnings, performance recommendations (e.g., missing index on foreign key).
  - Tab 2: **SQL DDL Preview**: Syntax-highlighted PostgreSQL statements with copy and download.
  - Tab 3: **AI Generation History**: Previous prompts, iteration diffs, and regeneration logs.
  - Tab 4: **Documentation Generator**: Auto-generated Markdown entity dictionary.

## 4. Acceptance Criteria
1. Submitting requirements produces a canonical schema model with zero orphaned foreign keys or conflicting types.
2. The user can add a table, delete a column, and change a relationship via UI, and the generated SQL reflects the change immediately.
3. Reloading the page or switching projects preserves table positions and all relational constraints.
4. Exported PostgreSQL SQL executes cleanly without dependency order errors.
5. All project routes reject unauthorized tokens.
