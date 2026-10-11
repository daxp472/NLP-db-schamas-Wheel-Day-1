# IMPLEMENTATION_PLAN.md — Phased Implementation Plan

## Overview
This document tracks task execution, verification results, blockers, and next steps for **Schema Studio AI**.

---

## Phase Status Summary

| Phase | Description | Status | Verification Result |
|---|---|---|---|
| **Phase 0** | Repository Audit, Planning & Documentation | **Completed** | Full documentation suite, architecture specs, and shared canonical schema created and compiled. |
| **Phase 1** | Design System & Frontend Foundation | **Completed** | Workbench theme, Navigation, Landing, Dashboard, Workspace, Studio layouts built and verified. |
| **Phase 2** | Core Canonical Schema Model & Interactive ER Editor | **Completed** | React Flow ER canvas, TableNode, RelationshipEdge, Inspector, DDL generator, Undo/Redo built. |
| **Phase 3** | Backend Architecture, Auth & Persistence | **Completed** | Express server, official MongoDB driver with resilient fallback, JWT auth, and project CRUD verified. |
| **Phase 4** | Gemini AI Generation & Multi-Tier Validation Pipeline | **Completed** | Official @google/genai SDK pipeline, Zod schema validation, semantic DB checks, and repair loop. |
| **Phase 5** | Deterministic SQL Generation & Export Engine | **Completed** | Topological sort DDL generation, circular FK handling, .sql and .md data dictionary exports verified. |
| **Phase 6** | Security Hardening, Verification & Polish | **Completed** | 12 automated unit tests passing, production build passing, healthcheck verified live. |
| **Phase A** | Public Website Audit & Planning | **Completed** | Page inventory documented, site navigation planned, zero-auth scope confirmed and enforced. |
| **Phase B** | Public Design System, Header & Footer Navigation | **Completed** | Responsive PublicHeader, PublicFooter, and PublicLayout built with active states, badges, and mobile drawer. |
| **Phase C** | Homepage, Product, Features & How It Works Pages | **Completed** | Distinctive LandingPage, in-depth ProductPage, technical FeaturesPage, and 6-step HowItWorksPage implemented. |
| **Phase D** | Use Cases, Contact, FAQ, About & Legal Pages | **Completed** | 7 domain Use Cases, functional Contact form with backend persistence, searchable FAQ, About, and Legal drafts. |
| **Phase E** | Existing Workspace UI/UX Refinement | **Completed** | Studio/Workspace topbar updated with seamless website back-navigation; dark engineering tokens preserved. |
| **Phase Auth** | Authentication & User Accounts System | **Completed** | Secure registration, login, logout, password recovery, session revocation, email verification, account settings, and project ownership isolation verified. 21 tests pass; monorepo build passes. |
| **Phase Collab-1** | Public Projects & Visibility Engine | **Completed** | Explicit private/public toggles, public Explore discovery gallery with pagination and dialect filters, read-only interactive architecture viewer (`/p/:projectId`), and zero data leakage. |
| **Phase Collab-2** | Project Cloning & Lineage System | **Completed** | Deep schema cloning with decoupled entity/field IDs, atomic clone counters, lineage attribution tracking, and independent project editing. |
| **Phase Collab-3** | Team Collaboration & Access Control | **Completed** | Role-based authorization (`owner`, `editor`, `viewer`), single-use invitation token lifecycle with email validation, and optimistic concurrency revision conflict prevention (409). |
| **Phase Collab-4** | Environment Configuration & Production Hardening | **Completed** | Fail-fast startup validation, `.env.example`, full automated test suite (32 passed out of 32 tests), and complete production monorepo build. |
| **Phase Hotfix** | Project Auto-Provisioning & Team Route Aliasing | **Completed** | Fixed 404 on unpersisted `proj_` client projects when publishing or opening Team modal. Added server-side auto-provisioning, flexible `_id`/`id`/`ObjectId` query resolution, and route aliases for `/members/invite` and `/members/:id/role`. |


---

## Detailed Task Breakdown

### Phase 0: Repository Audit and Planning
- [x] Inspect workspace and initialize repo structure.
- [x] Create `AGENTS.md` and `RULES.md`.
- [x] Create comprehensive architecture and specification documents:
  - [x] `docs/PRODUCT_SPEC.md`
  - [x] `docs/ARCHITECTURE.md`
  - [x] `docs/IMPLEMENTATION_PLAN.md`
  - [x] `docs/DATABASE_SCHEMA.md`
  - [x] `docs/API_SPEC.md`
  - [x] `docs/AI_GENERATION.md`
  - [x] `docs/SECURITY.md`
  - [x] `docs/TESTING.md`
  - [x] `.env.example`
- [x] Initialize monorepo workspace packages (`shared`, `server`, `client`).
- [x] Define canonical schema TypeScript interfaces and Zod schemas in `shared`.
*Exit criteria: Planning documents exist, shared canonical schema compiles without error.*

### Phase 1: Design System & Frontend Foundation
- [x] Set up Vite + React + TypeScript + Tailwind CSS with dark graphite theme tokens.
- [x] Implement responsive application layout & navigation bar.
- [x] Build high-converting Landing Page with interactive mini ER diagram demo.
- [x] Build Project Dashboard with search, filter, dialect badges, recent projects list, and template loaders.
- [x] Build Requirement Creation Workspace with natural language prompt guides, character counter, and module options.
- [x] Build Schema Studio multi-panel workbench layout (Toolbar, Schema Explorer, Canvas viewport, Inspector, Bottom Drawer).
*Exit criteria: Complete navigable UI flow, zero blank placeholder screens.*

### Phase 2: Core Schema Model & ER Editor
- [x] Integrate `@xyflow/react` (React Flow) on Schema Studio canvas.
- [x] Build custom `EntityTableNode` with column indicators (PK, FK, UQ, NULL) and handles.
- [x] Implement custom relationship edges with cardinality markers (1:1, 1:N, N:M).
- [x] Build DAG-based auto-layout engine.
- [x] Implement Entity Inspector (edit table name, add/edit/delete columns, edit types, constraints).
- [x] Implement Relationship Inspector (cardinality, onDelete/onUpdate cascade rules).
- [x] Implement bidirectional state synchronization between canvas and canonical schema.
- [x] Implement Undo / Redo history stack.
*Exit criteria: Real-time visual editing of tables and relationships with zero state divergence.*

### Phase 3: Backend and Persistence
- [x] Set up Express + TypeScript server with standard middlewares (cors, helmet, json).
- [x] Configure MongoDB connection using official `mongodb` driver with automatic in-memory fallback.
- [x] Implement User Authentication (Register, Login, JWT auth, bcrypt password hashing) preserved for backend security.
- [x] Implement Project CRUD endpoints (`/api/projects`).
- [x] Implement Schema persistence with snapshot versioning (`/api/projects/:id/schema`).
- [x] Implement guest development workflow (`dev_user_default`) to avoid auth gating in studio/workspace.
*Exit criteria: End-to-end user registration, project creation, saving, and reloading via MongoDB.*

### Phase 4: Gemini Generation Pipeline
- [x] Integrate `@google/genai` on backend with configurable model (`gemini-2.5-flash`).
- [x] Implement system prompt with relational design guidelines and strict JSON schema contract.
- [x] Implement request relevance & safety checks.
- [x] Implement Zod contract validation on AI response.
- [x] Implement deterministic semantic database validator (missing FK references, circular references, composite keys).
- [x] Implement bounded 1-retry schema repair mechanism.
- [x] Wire `/api/projects/:id/generate` from requirement workspace to frontend canvas.
*Exit criteria: Submitting natural language requirement returns validated canonical schema and renders in ER canvas.*

### Phase 5: SQL and Exports
- [x] Implement deterministic PostgreSQL DDL generator with topological sort for table dependency ordering.
- [x] Support composite keys, indexes, check constraints, default values, and foreign key cascades.
- [x] Implement SQL Syntax highlighting preview drawer with Copy and Download (`.sql`).
- [x] Implement Diagram export (PNG and SVG format).
- [x] Implement Schema JSON and Markdown documentation dictionary export.
*Exit criteria: Generated SQL passes PostgreSQL syntax and dependency ordering tests.*

### Phase 6: Security, Quality & Final Polish
- [x] Verify rate limiting and prompt injection protections.
- [x] Implement comprehensive unit tests for SQL generator and Schema validator.
- [x] Verify responsive layouts, keyboard accessibility, and contrast.
- [x] Run production build and linting across client, server, and shared.
- [x] Final end-to-end verification walkthrough.
*Exit criteria: All tests pass, production builds succeed, full end-to-end flow verified.*

---

## Public Website & Product Experience Expansion

### Phase A: Audit, Information Architecture & Scope Planning
- [x] Audit existing workbench routes (`/dashboard`, `/workspace`, `/studio/:id`) and components.
- [x] Confirm zero-auth constraint: No new registration, login, logout, password reset, or OAuth flows.
- [x] Establish design aesthetic: High-contrast dark graphite engineering aesthetic (`#0B0D13`, `#12151F`, `#23283B`, `#00D2FF`, `#10B981`) with blueprint motifs and editorial typography.
- [x] Define public route architecture:
  - `/` — Homepage / Landing
  - `/product` — Product Architecture & Deep Dive
  - `/features` — Feature Breakdown Catalog
  - `/how-it-works` — 6-Step Requirement-to-DDL Walkthrough
  - `/use-cases` — 7 Concrete Domain Schema Walkthroughs
  - `/contact` — Functional Inquiries & Support with Server Persistence
  - `/faq` — 10 Common Technical Questions with Search & Categories
  - `/about` — Engineering Philosophy & Team Mission
  - `/privacy` — Privacy Policy (Draft)
  - `/terms` — Terms of Service (Draft)
*Verification: Page inventory and architecture approved.*

### Phase B: Public Design System, Header & Footer Navigation
- [x] Build `PublicHeader.tsx`:
  - Brand identity with active route indicators.
  - Desktop nav links (Product, Features, How It Works, Use Cases, FAQ, Contact).
  - Dialect support pill (`PostgreSQL 14+`) and System Online status beacon.
  - Direct CTA button leading to `/workspace` ("Start Designing").
  - Accessible mobile toggle button and sliding drawer.
- [x] Build `PublicFooter.tsx`:
  - Structured engineering footer organized into Product, Capabilities, Resources, and Legal columns.
  - Quick launch links into E-Commerce and SaaS templates.
  - Live API status indicator (`http://localhost:5000/api/health`).
- [x] Build `PublicLayout.tsx`:
  - Standardized shell wrapping all 10 marketing pages with header and footer.
*Verification: Verified responsive layout behavior, active tab highlighting, and zero broken links.*

### Phase C: Homepage, Product, Features & How It Works Pages
- [x] Build `LandingPage.tsx` (`/`):
  - Hero with concrete positioning: Requirements ➔ Validated Schemas ➔ Deterministic SQL.
  - Interactive Preview tab with live `@xyflow/react` ER Canvas rendering real `SAMPLE_ECOMMERCE_SCHEMA`.
  - 4-step workflow overview with execution guarantees.
  - Tabbed generated artifact preview (Tables, Relationships, PostgreSQL DDL, Validation Report).
  - High-impact bottom CTA leading to `/workspace` and `/dashboard`.
- [x] Build `ProductPage.tsx` (`/product`):
  - 10 in-depth architectural engine walkthroughs covering Natural-Language Analysis, Strict Schema Extraction, Interactive ER Editing, Key Modeling, Cardinality Verification, Semantic Database Validation, Topological DDL Sorting, Data Dictionary Export, Snapshot Persistence, and Complete End-to-End Execution.
  - Clear markers distinguishing implemented vs. planned dialect expansions.
- [x] Build `FeaturesPage.tsx` (`/features`):
  - Distinctive technical layouts for each capability (Entity Extraction, Relationship Inference, Interactive Canvas, Visual DDL Inspector, Topological Sort, Documentation Generator).
  - Technical specs and architecture callouts instead of repetitive cards.
- [x] Build `HowItWorksPage.tsx` (`/how-it-works`):
  - 6-step deep dive (Requirements ➔ Extraction ➔ Canonical Synthesis ➔ Semantic Validation ➔ ER Visual Workbench ➔ Production DDL & Docs).
  - Side-by-side practical example: Natural language requirements to PostgreSQL schema output.
*Verification: All 4 core product pages render with rich interactive elements, code blocks, and valid routing.*

### Phase D: Use Cases, Contact, FAQ, About & Legal Pages
- [x] Build `UseCasesPage.tsx` (`/use-cases`):
  - 7 concrete domain models: E-Commerce, Multi-Tier LMS, B2B SaaS Billing, Warehouse Inventory, Healthcare Appointments, Agile Project Management, and Municipal Library Catalog.
  - Problem statements, entity breakdowns, relationship constraints, and direct CTA to load in studio.
- [x] Build `FAQPage.tsx` (`/faq`):
  - 10 comprehensive architectural and database engineering questions.
  - Real-time search query filtering and category filters (All, General, AI & Prompting, Database & SQL, Security).
  - Accessible accordion disclosure animations.
- [x] Build `AboutPage.tsx` (`/about`):
  - Honest engineering philosophy: Why transparent, verifiable AI matters over black-box code generation.
  - Core design principles: Determinism over hallucination, relational integrity, zero-divergence canvas.
- [x] Build `ContactPage.tsx` (`/contact`):
  - Real functional contact form with client-side Zod validation.
  - Backend API endpoint (`POST /api/contact`) with rate limiting and MongoDB persistence.
  - Loading, error, and reference ID success states.
  - Direct public contact fallback (`engineering@schemastudio.internal`).
- [x] Build `PrivacyPage.tsx` (`/privacy`) and `TermsPage.tsx` (`/terms`):
  - Distinctly marked drafts explaining prompt transit, Gemini API handling, zero client storage of API secrets, and generated SQL safety guidelines.
*Verification: Tested form submissions, FAQ searching, and responsive layouts across all support pages.*

### Phase E: Existing Workspace UI/UX Refinement
- [x] Update `Navbar.tsx` in the core workbench:
  - Added visible `← Website` back-link for intuitive round-trip navigation between Studio and Marketing pages.
- [x] Ensure guest workflow (`dev_user_default`) functions seamlessly without requiring login forms.
- [x] Verify ER canvas, Entity Inspector, and bottom drawer remain 100% operational.
*Verification: Navigating back and forth between public site and Studio preserves schema state without issues.*

### Phase F: Testing, Verification & Production Build
- [x] Server unit tests:
  - `src/__tests__/sql-generator.test.ts` (5 tests passing)
  - `src/__tests__/schema-validator.test.ts` (7 tests passing)
  - `src/__tests__/contact.test.ts` (1 test passing)
  - Total: 13 passed tests.
- [x] Monorepo production build:
  - `@schema-studio/shared`: TypeScript compile (`tsc`) passed with 0 errors.
  - `@schema-studio/server`: TypeScript compile (`tsc`) passed with 0 errors.
  - `@schema-studio/client`: TypeScript compile & Vite production build (`tsc && vite build`) passed with 0 errors.
- [x] Service availability:
  - Backend HTTP server live on `http://localhost:5000` (Healthcheck HTTP 200).
  - Frontend Vite server live on `http://localhost:5173` (HTTP 200).
*Verification: Monorepo build and automated tests pass with 0 warnings or errors.*

---

## Authentication & User Accounts Phase

### Phase Auth-1: Authentication Architecture Audit & Security Design
- [x] Inspect existing authentication routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`), password hashing (`bcryptjs`), and token verification (`jsonwebtoken`).
- [x] Audit database collections (`users`, `projects`, `sessions`, `password_resets`).
- [x] Audit development-only identity usage (`dev_user_default`) and plan migration to authenticated user context.
- [x] Design token lifecycle: Short-lived access token + session revocation tracking, rate limiting against brute force, and generic authentication error messages.
*Verification: Audit complete, security architecture designed.*

### Phase Auth-2: Backend Authentication Engine & Extended Endpoints
- [x] Implement enhanced password strength policy and normalized email indexing.
- [x] Implement `POST /api/auth/logout` with server-side session/token invalidation.
- [x] Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` with cryptographically secure single-use token hashes and expiration.
- [x] Implement `POST /api/auth/verify-email` and `POST /api/auth/resend-verification` with documented delivery fallback.
- [x] Implement `PATCH /api/auth/profile` and `POST /api/auth/change-password`.
- [x] Implement `GET /api/auth/sessions` and `DELETE /api/auth/sessions/:id`.
- [x] Implement `DELETE /api/auth/account` with safe cascade deletion of user projects.
- [x] Enforce strict rate limits on `/api/auth/*` (register, login, forgot-password).
*Verification: All 12 endpoints implemented with Zod validation, bcrypt password hashing, and active session revocation tracking.*

### Phase Auth-3: Frontend Authentication UX & Pages
- [x] Build `/register` page with real-time password strength, visibility toggle, terms agreement, and validation.
- [x] Build `/login` page with remember-me, forgot password link, and non-sensitive error banners.
- [x] Build `/forgot-password` and `/reset-password` recovery flow with token validation.
- [x] Build `/verify-email` page confirming email verification token.
- [x] Ensure all pages follow the dark developer workbench aesthetic (`#0B0D13`, `#12151F`, `#00D2FF`).
*Verification: All auth pages render with custom forms, responsive layouts, and zero mock behavior.*

### Phase Auth-4: Client AuthContext, Token Storage & Route Protection
- [x] Implement `AuthContext` with login, register, logout, profile update, and session loading states.
- [x] Implement route guards (`ProtectedRoute`) protecting private routes (`/dashboard`, `/settings`) with safe return URL redirection.
- [x] Update `PublicHeader` and `Navbar` with account menus (user name, email, verified badge, settings, sign out).
*Verification: Protected routes redirect unauthenticated users to `/login?redirect=...` and restore destination upon sign in.*

### Phase Auth-5: Project Ownership Migration & Guest Data Segregation
- [x] Remove `dev_user_default` bypass in production backend endpoints.
- [x] Enforce server-side ownership checks (`project.userId === req.user.id`) on all CRUD and schema mutations.
- [x] Update frontend dashboard and workspace to fetch and persist user-specific projects from API when authenticated.
- [x] Keep guest/demo mode strictly isolated to in-memory templates without cross-polluting user projects.
- [x] Ensure frontend wipes cached project data on logout or account switch.
*Verification: Cross-user access returns 403 Forbidden; unauthenticated requests to `/api/projects` return 401.*

### Phase Auth-6: Account Settings & UX Management
- [x] Build `/settings` page with Profile, Security (Change Password), Sessions, and Danger Zone tabs.
- [x] Wire profile updates and password change with instant feedback.
- [x] Support session revocation and permanent account deletion.
*Verification: Account settings page tested and verified.*

### Phase Auth-7: Automated Testing & Security Verification
- [x] Comprehensive Vitest test suite for registration, login, logout, password recovery, ownership checks, and account deletion (`server/src/__tests__/auth.test.ts`).
- [x] Run full monorepo production build (`npm run build`).
- [x] Verify live endpoints on development servers.
*Verification: 21 server tests passing across 4 test suites; full monorepo build passing with exit code 0.*

### Phase Collab-1: Public Projects, Visibility & Discovery Gallery
- [x] Define `ProjectVisibility` ('private' | 'public') with private default in schema models.
- [x] Implement authenticated owner visibility endpoint (`PATCH /api/projects/:id/visibility`).
- [x] Build public project discovery gallery (`/explore`) with dialect filter pills, search input, sort options, and pagination.
- [x] Build public read-only architecture detail view (`/p/:projectId`) with interactive ER canvas, table inspector, DDL preview, and author attribution.
- [x] Enforce server-side data sanitization removing emails, tokens, internal IDs, and private notes from public payloads.
*Verification: Public gallery lists published projects only; unpublishing immediately returns 404/denies public access.*

### Phase Collab-2: Real Project Cloning & Lineage Tracking
- [x] Implement deep schema cloning (`POST /api/projects/:id/clone`) for authenticated users.
- [x] Remap entity IDs and field IDs across primary keys, foreign keys, constraints, and diagram layout positions so clone is completely independent.
- [x] Atomically increment project `cloneCount` and persist `clonedFrom` lineage attribution.
- [x] Ensure cloned projects belong exclusively to the cloning user and default to private visibility.
*Verification: Cloned projects open and edit independently in Schema Studio; modifications to original or clone do not affect each other.*

### Phase Collab-3: Team Collaboration, Role Authorization & Invitations
- [x] Define collaboration roles (`owner`, `editor`, `viewer`) and enforce permissions on server endpoints.
- [x] Implement cryptographically secure single-use invitation tokens (`POST /api/projects/:id/members/invite`).
- [x] Implement invitation acceptance (`POST /api/invitations/accept`) with invitee email matching validation.
- [x] Implement invitation decline and revocation (`DELETE /api/projects/:id/invitations/:invitationId`).
- [x] Build dedicated Teams & Collaboration workbench page (`/collaboration`) with tabbed views and invitation accept banner.
- [x] Implement optimistic concurrency revision checking (`POST /api/projects/:id/save-schema` returning 409 `SCHEMA_CONFLICT`).
*Verification: Viewers cannot save schema changes (403); stale revision saves return 409 conflict; revoked members immediately lose access.*

### Phase Collab-4: Environment Validation, Monorepo Build & Testing
- [x] Implement fail-fast server environment validator (`validateEnv`) checking required variables on startup.
- [x] Create root `.env` and `.env.example` documenting all configuration keys.
- [x] Add automated test suite covering visibility, cloning, permissions, invitation lifecycle, and revision conflicts (`server/src/__tests__/projects-collaboration.test.ts`).
- [x] Run full monorepo build and all 30 automated server tests.
*Verification: 30 of 30 tests pass across 5 test suites; monorepo build passes.*

### Phase Collab-5: Invitation Lifecycle Fixes, Schema Copilot Chat & Batch Questions Resolver
- [x] Fix 404 on `GET /api/invitations/my-invitations` and accept/decline body token payload compatibility in `server/src/routes/invitation.routes.ts` & `invitation.controller.ts`.
- [x] Seamless teammate invitation: instant link copying, email normalization, active listing in pending invites on `/collaboration`.
- [x] AI Schema Copilot Update Chat (`POST /api/projects/iterate`):
  - Added Copilot chat drawer and bottom panel in workbench.
  - Natural language schema iteration with instant canvas diff highlights and change summaries.
- [x] Batch Unresolved Questions Resolver (`POST /api/projects/resolve-questions`):
  - Pre-fill template and unified batch resolution interface answering all pending architectural questions simultaneously.
  - Clears resolved questions, updates entities/relationships/constraints, and visualizes changes instantly.
*Verification: 35 of 35 server tests passing; monorepo builds with exit code 0; dev servers running in background.*



