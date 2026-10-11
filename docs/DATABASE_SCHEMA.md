# DATABASE_SCHEMA.md — Persistence Model & Schema Conventions

## 1. Application Persistence Model (MongoDB)

Schema Studio AI uses MongoDB as its primary persistence engine via the official Node.js `mongodb` driver.

### 1.1 Collections Overview

```
database: schema_studio
├── users
├── projects
└── schema_versions
```

### 1.2 `users` Collection
Stores registered user accounts and credentials.

```typescript
interface UserDocument {
  _id: ObjectId;
  email: string;           // Unique index, normalized lowercased
  passwordHash: string;    // bcrypt hash with salt rounds >= 12
  name: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionDocument {
  _id: ObjectId;
  userId: ObjectId;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

interface PasswordResetDocument {
  _id: ObjectId;
  userId: ObjectId;
  email: string;
  tokenHash: string;       // SHA-256 hash of single-use recovery token
  expiresAt: Date;         // 60 minutes TTL
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

interface EmailVerificationDocument {
  _id: ObjectId;
  userId: ObjectId;
  email: string;
  tokenHash: string;       // SHA-256 hash of verification token
  expiresAt: Date;         // 24 hours TTL
  used: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}
```

### 1.3 `projects` Collection
Represents a database design workspace created by a user.

```typescript
interface ProjectDocument {
  _id: ObjectId;
  userId: ObjectId;                 // Indexed for fast user lookups
  name: string;
  description: string;
  targetDialect: 'postgresql' | 'mysql' | 'sqlite';
  requirements: {
    rawPrompt: string;
    modules?: string[];
    rules?: string[];
    assumptions?: string[];
    unresolvedQuestions?: string[];
  };
  currentSchema: CanonicalSchema;   // Full canonical schema state
  layout: {
    nodes: Array<{ id: string; x: number; y: number }>;
    zoom?: number;
  };
  visibility: 'private' | 'public'; // Indexed: for public discovery
  cloneCount: number;               // Indexed: for sorting by popularity
  clonedFrom?: {
    sourceProjectId: string;
    sourceProjectName: string;
    sourceOwnerName: string;
    clonedAt: string;
  };
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: 'owner' | 'editor' | 'viewer';
    addedAt: string;
  }>;                               // Indexed: "members.userId" for collaboration lookups
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 `schema_versions` Collection
Maintains an immutable audit and snapshot history for schema iterations.

```typescript
interface SchemaVersionDocument {
  _id: ObjectId;
  projectId: ObjectId;              // Indexed
  versionNumber: number;
  snapshot: CanonicalSchema;
  changeSummary?: string;
  triggeredBy: 'ai_generation' | 'manual_edit' | 'repair';
  createdAt: Date;
}
```

### 1.5 `project_invitations` Collection
Tracks invitation tokens and lifecycle for project collaboration.

```typescript
interface ProjectInvitationDocument {
  _id: ObjectId;
  projectId: string;                // Indexed
  projectName: string;
  invitedEmail: string;             // Indexed: normalized lowercased
  role: 'editor' | 'viewer';
  inviterUserId: string;
  inviterName: string;
  inviterEmail: string;
  tokenHash: string;                // Unique Index: SHA-256 hash of single-use token
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  expiresAt: Date;                  // 7 days TTL
  createdAt: Date;
  updatedAt?: Date;
}
```

---

## 2. Canonical Schema Model (Target Output)

The Canonical Schema model is the engine-agnostic relational schema definition shared across frontend, backend, AI validation, and SQL generation.

```typescript
export interface CanonicalSchema {
  version: string; // e.g. "1.0.0"
  projectName: string;
  targetDialect: 'postgresql' | 'mysql' | 'sqlite';
  entities: Entity[];
  relationships: Relationship[];
  assumptions: string[];
  unresolvedQuestions: string[];
}

export interface Entity {
  id: string;              // e.g. "users", "orders" (stable id)
  name: string;            // Table name e.g. "users"
  description?: string;
  fields: Field[];
  indexes?: Index[];
  checks?: CheckConstraint[];
}

export interface Field {
  id: string;              // e.g. "users_id"
  name: string;            // Column name e.g. "id"
  dataType: SQLDataType;   // e.g. "uuid", "varchar(255)", "integer"
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface Relationship {
  id: string;
  sourceEntityId: string;   // Child table (contains FK)
  sourceFieldId: string;    // FK Column
  targetEntityId: string;   // Parent table (contains PK)
  targetFieldId: string;    // PK Column
  cardinality: '1:1' | '1:N' | 'N:M';
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}
```
