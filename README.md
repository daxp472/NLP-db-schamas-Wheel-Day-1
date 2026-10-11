# Schema Studio AI 🚀
### AI-Powered Database Schema & Entity-Relationship (ER) Diagram Studio

[![Live Stream](https://img.shields.io/badge/YouTube-Watch%20Live%20Build-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/live/wDYYFaLU2lE?si=BfrbuuH_f3cPTf9q)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/daxp472/NLP-db-schamas-Wheel-Day-1.git)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📺 Live Stream & Development
Watch the complete build process, architecture design, and live implementation of this project on YouTube:  
🔗 **[Live Stream: Building Schema Studio AI](https://www.youtube.com/live/wDYYFaLU2lE?si=BfrbuuH_f3cPTf9q)**

GitHub Repository:  
🔗 **[https://github.com/daxp472/NLP-db-schamas-Wheel-Day-1.git](https://github.com/daxp472/NLP-db-schamas-Wheel-Day-1.git)**

---

## 💡 Overview

**Schema Studio AI** transforms unstructured natural-language software requirements and business prompts into validated, production-grade relational database schemas, interactive Entity-Relationship (ER) diagrams, deterministic SQL DDL scripts, and complete documentation.

It is designed with a strict engineering ethos:
* **Canonical Schema Source of Truth**: Relational database semantics are strictly separated from visual layout coordinates.
* **Deterministic Validation**: AI output is verified through Zod schema parsing followed by deep relational semantic checks (composite PK validity, foreign key target existence and type compatibility, circular references, and normal form validation).
* **Multi-Dialect DDL Engine**: Deterministic SQL generation for PostgreSQL, MySQL, SQLite, SQL Server (T-SQL), and Oracle.
* **Full Product Experience**: Complete authentication system, public project showcase, fork/clone engine, role-based team collaboration with invitation tokens, AI Schema Copilot chat, and a batch unresolved questions solver.

---

## ✨ Core Features

### 🧠 1. Intelligent Schema Generation & Inference
* **Natural Language to 3NF/BCNF Schema**: Ingests user specifications and generates tables, columns, primary keys, foreign keys, unique indices, checks, and cascade rules.
* **Inference Engine**: Discloses implicit assumptions, potential edge cases, trade-offs, and unresolved architectural questions.
* **Dialect Optimization**: Tailors column data types, sequences, auto-increments, and table constraints to the target SQL dialect.

### 🎨 2. Visual Entity-Relationship (ER) Workbench
* **Custom Interactive Canvas**: Smooth pan, zoom, auto-fit, and drag-and-drop table positioning using `@xyflow/react`.
* **Dynamic Relationship Routing**: Smart orthogonal bezier connectors with Crow's Foot cardinality notations (1:1, 1:N, N:M).
* **Inspector & Visual Editor**: Add/edit/delete tables, columns, constraints, foreign keys, indexes, and custom table colors.
* **Multi-Canvas Export**: Export high-resolution PNG, SVG, JSON schema, or raw SQL DDL with one click.

### 💬 3. AI Schema Copilot & Update Chat
* **Conversational Schema Iteration**: Ask the AI in natural language to make schema updates (*"Add a payments table"*, *"Add soft-delete deleted_at columns across all tables"*, *"Update order status to an enum"*).
* **Live Diff & Highlighting**: Instantly inspect changes on the canvas with color-coded diff banners and auto-generated changelogs.
* **Comprehensive Undo/Redo**: Full history snapshot management across all visual and AI edits.

### ❓ 4. Batch Unresolved Questions Resolver
* **One-Stop Architectural Decision Maker**: Review all pending questions inferred by the AI in one unified modal.
* **Batch Answering**: Pre-fill answers with template guidance or answer all 10+ questions together in a single prompt.
* **Automatic Re-Synthesis**: Resolves questions, updates table structures, applies constraints, and clears resolved items.

### 👥 5. Team Collaboration & Invitations
* **Role-Based Access Control**: Granular roles (`owner`, `editor`, `viewer`) with server-enforced permissions.
* **Secure Token Invitations**: Cryptographically secure single-use invitation tokens with expiration.
* **Team Workbench (`/collaboration`)**: Manage team members, pending outgoing invitations, received incoming invites, and project access.
* **Direct Invite Links**: Copyable invitation links (`http://localhost:5173/collaboration?invite=<token>`) for instant onboarding.
* **Optimistic Concurrency Control**: Prevents concurrent overwrite conflicts via schema revision numbering.

### 🌐 6. Public Showcase & Clone / Fork System
* **Public Gallery (`/explore`)**: Discover published community schemas filtered by dialect, tag, or keyword.
* **Deep Schema Cloning**: Fork any public schema into an independent, editable personal copy with remapped IDs and lineage attribution.
* **Public Architecture View (`/p/:projectId`)**: Read-only interactive view with ER canvas, data dictionary, and DDL scripts.

### 🔒 7. Enterprise Security & User Accounts
* **Full Authentication Flow**: Register, login, email verification, password reset, profile management, and session revocation.
* **Password Hashing**: Industry-standard `bcryptjs` hashing with salt rounds.
* **Server-Side Session Store**: Revocable active sessions and strict rate-limiting on authentication endpoints.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, `@xyflow/react` (React Flow), Lucide React, Tailwind CSS |
| **Backend** | Node.js, Express 4, TypeScript, `tsx` |
| **Database** | MongoDB with native driver & Mongoose models |
| **AI Engine** | Google Gemini (`gemini-2.5-flash`), Google GenAI SDK |
| **Validation** | Zod 3, Semantic Relational Validator |
| **Testing** | Vitest, Supertest |
| **Shared** | Monorepo architecture (`@schema-studio/shared`) with canonical TypeScript models |

---

## 📁 Repository Structure

```text
.
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── components/         # Modals, workbench, ER canvas, navigation
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── hooks/              # useSchema, useUndoRedo
│   │   ├── pages/              # Landing, Studio, Explore, Collaboration, Auth pages
│   │   ├── services/           # API client, export service, mock data
│   │   └── types/              # Client-specific types
│   └── package.json
├── server/                     # Backend Express + Node.js API
│   ├── src/
│   │   ├── controllers/        # Auth, project, invitation, contact controllers
│   │   ├── middleware/         # Auth guard, rate limit, validator middleware
│   │   ├── models/             # User, Project, Session, PasswordReset
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Gemini AI service, SQL generator, validator, email
│   │   └── __tests__/          # Vitest automated test suites
│   └── package.json
├── shared/                     # Shared TypeScript library
│   ├── src/
│   │   ├── types/              # Canonical Schema Model, AST types, DDL dialects
│   │   └── validators/         # Zod schemas & constraints
│   └── package.json
├── docs/                       # Architectural & Technical Specifications
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   ├── AI_GENERATION.md
│   └── IMPLEMENTATION_PLAN.md
└── package.json                # Root monorepo configuration
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: A running MongoDB instance (local or MongoDB Atlas)
* **Google Gemini API Key**: [Get a Gemini API key](https://aistudio.google.com/)

### 2. Clone Repository
```bash
git clone https://github.com/daxp472/NLP-db-schamas-Wheel-Day-1.git
cd NLP-db-schamas-Wheel-Day-1
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
```env
# Application
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/schema_studio

# Authentication & Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
SESSION_SECRET=your_session_secret_key_at_least_32_characters_long

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 5. Build Shared Library & Run Development Servers
```bash
# Build the shared TypeScript package
npm run build -w shared

# Start both Backend and Frontend in development mode
npm run dev
```

* **Frontend App**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🧪 Running Automated Tests

Run the full backend test suite covering authentication, permissions, schema validation, SQL DDL generation, project cloning, and team invitations:

```bash
npm run test -w server
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing & Community

Contributions, issues, and feature requests are welcome!  
Feel free to check out the [issues page](https://github.com/daxp472/NLP-db-schamas-Wheel-Day-1/issues).
