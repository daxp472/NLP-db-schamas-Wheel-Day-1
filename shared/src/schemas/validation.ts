import { z } from 'zod';

export const databaseDialectSchema = z.enum(['postgresql', 'mysql', 'sqlite']);

export const cardinalitySchema = z.enum(['1:1', '1:N', 'N:M']);

export const referentialActionSchema = z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']);

export const fieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Field name must be a valid SQL identifier',
  }),
  dataType: z.string().min(1),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  isNullable: z.boolean().default(true),
  isUnique: z.boolean().default(false),
  defaultValue: z.string().optional(),
  checkExpression: z.string().optional(),
  comment: z.string().optional(),
});

export const indexSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  isUnique: z.boolean().default(false),
  type: z.enum(['btree', 'hash', 'gin', 'gist']).optional(),
});

export const checkConstraintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  expression: z.string().min(1),
});

export const entitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'Table name must be a valid SQL identifier',
  }),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1, 'Entity must contain at least one column'),
  compositePrimaryKey: z.array(z.string()).optional(),
  indexes: z.array(indexSchema).optional().default([]),
  checks: z.array(checkConstraintSchema).optional().default([]),
  isJunctionTable: z.boolean().optional().default(false),
});

export const relationshipSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  sourceEntityId: z.string().min(1),
  sourceFieldId: z.string().min(1),
  targetEntityId: z.string().min(1),
  targetFieldId: z.string().min(1),
  cardinality: cardinalitySchema.default('1:N'),
  isSourceOptional: z.boolean().optional().default(false),
  isTargetOptional: z.boolean().optional().default(false),
  onDelete: referentialActionSchema.optional().default('CASCADE'),
  onUpdate: referentialActionSchema.optional().default('CASCADE'),
  description: z.string().optional(),
});

export const layoutMetadataSchema = z.object({
  positions: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
    })
  ),
  zoom: z.number().optional(),
}).optional();

export const canonicalSchemaZodSchema = z.object({
  version: z.string().default('1.0.0'),
  projectName: z.string().min(1),
  targetDialect: databaseDialectSchema.default('postgresql'),
  entities: z.array(entitySchema),
  relationships: z.array(relationshipSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  unresolvedQuestions: z.array(z.string()).default([]),
  layout: layoutMetadataSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const generateRequirementInputSchema = z.object({
  prompt: z.string().min(15, 'Requirements must be at least 15 characters long').max(10000),
  applicationName: z.string().min(1).max(100).optional(),
  targetDialect: databaseDialectSchema.default('postgresql'),
  modules: z.array(z.string()).optional().default([]),
  suggestedEntities: z.array(z.string()).optional().default([]),
  rules: z.array(z.string()).optional().default([]),
  expectedScale: z.string().optional(),
});

export const projectVisibilitySchema = z.enum(['private', 'public']);

export const collaborationRoleSchema = z.enum(['owner', 'editor', 'viewer']);

export const inviteCollaboratorSchema = z.object({
  email: z.string().email('Please provide a valid collaborator email address.').transform((v) => v.toLowerCase().trim()),
  role: z.enum(['editor', 'viewer']).default('editor'),
});

export const updateVisibilitySchema = z.object({
  visibility: projectVisibilitySchema,
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

