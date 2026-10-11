export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite';

export type Cardinality = '1:1' | '1:N' | 'N:M';

export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export type CommonSQLDataType =
  | 'uuid'
  | 'bigint'
  | 'integer'
  | 'smallint'
  | 'serial'
  | 'bigserial'
  | 'varchar(50)'
  | 'varchar(100)'
  | 'varchar(255)'
  | 'text'
  | 'boolean'
  | 'timestamp'
  | 'timestamptz'
  | 'date'
  | 'time'
  | 'numeric(10,2)'
  | 'numeric(12,4)'
  | 'decimal'
  | 'float'
  | 'double precision'
  | 'json'
  | 'jsonb'
  | 'bytea';

export interface Field {
  id: string;               // Stable ID e.g. "f_users_id"
  name: string;             // Column name e.g. "id"
  dataType: string;         // e.g. "uuid", "varchar(255)", "timestamptz"
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  checkExpression?: string;
  comment?: string;
}

export interface Index {
  id: string;
  name: string;
  fields: string[];         // Field IDs or column names
  isUnique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface CheckConstraint {
  id: string;
  name: string;
  expression: string;
}

export interface Entity {
  id: string;               // Stable ID e.g. "e_users"
  name: string;             // Table name e.g. "users"
  description?: string;
  fields: Field[];
  compositePrimaryKey?: string[]; // Array of Field IDs if composite PK
  indexes?: Index[];
  checks?: CheckConstraint[];
  isJunctionTable?: boolean;
}

export interface Relationship {
  id: string;               // Stable ID e.g. "rel_users_orders"
  name?: string;
  sourceEntityId: string;   // Child entity (holds the FK)
  sourceFieldId: string;    // FK field in child entity
  targetEntityId: string;   // Parent entity (holds the PK)
  targetFieldId: string;    // PK field in parent entity
  cardinality: Cardinality;
  isSourceOptional?: boolean;
  isTargetOptional?: boolean;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
  description?: string;
}

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  entityId?: string;
  fieldId?: string;
  relationshipId?: string;
  code: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: DiagnosticIssue[];
  warnings: DiagnosticIssue[];
  infos: DiagnosticIssue[];
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface LayoutMetadata {
  positions: Record<string, NodePosition>; // keyed by entityId
  zoom?: number;
}

export interface CanonicalSchema {
  version: string;          // e.g. "1.0.0"
  projectName: string;
  targetDialect: DatabaseDialect;
  entities: Entity[];
  relationships: Relationship[];
  assumptions: string[];
  unresolvedQuestions: string[];
  layout?: LayoutMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  targetDialect: DatabaseDialect;
  tableCount?: number;
  relationshipCount?: number;
  visibility?: ProjectVisibility;
  cloneCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectVisibility = 'private' | 'public';

export type CollaborationRole = 'owner' | 'editor' | 'viewer';

export interface ProjectMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

export interface ProjectLineage {
  sourceProjectId: string;
  sourceProjectName: string;
  sourceOwnerName: string;
  clonedAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedEmail: string;
  email?: string;
  role: 'editor' | 'viewer';
  inviterName: string;
  inviterEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  expiresAt: string;
  createdAt: string;
  token?: string;
}

export interface PublicProjectSummary {
  id: string;
  name: string;
  description: string;
  targetDialect: DatabaseDialect;
  authorName: string;
  tableCount: number;
  relationshipCount: number;
  cloneCount: number;
  tags?: string[];
  updatedAt: string;
  createdAt: string;
  clonedFrom?: {
    sourceProjectId: string;
    sourceProjectName: string;
    sourceOwnerName: string;
  };
}

