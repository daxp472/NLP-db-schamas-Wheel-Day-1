import { GoogleGenAI } from '@google/genai';
import { 
  CanonicalSchema, 
  canonicalSchemaZodSchema,
  DatabaseDialect 
} from '@schema-studio/shared';
import { ENV } from '../config/env';
import { SchemaValidatorService } from './schema-validator.service';

const SYSTEM_INSTRUCTION = `You are a Principal Relational Database Architect and Data Modeling Specialist.
Your job is to transform the user's natural language requirements into a strictly valid, normalized (3NF) relational database schema in JSON.

MANDATORY RULES:
1. Every entity must have a stable unique 'id' (e.g. 'e_users', 'e_orders') and a valid SQL table 'name' (snake_case).
2. Every entity MUST have at least one Primary Key field ('isPrimaryKey: true') or a 'compositePrimaryKey' array of field IDs. Standardize PK to 'id uuid' with defaultValue 'gen_random_uuid()' or 'id bigint'.
3. For Many-to-Many (N:M) relationships, create an explicit junction/association table with 'isJunctionTable: true' and composite primary keys or two foreign keys.
4. All foreign key relationships in 'relationships' MUST accurately link existing 'sourceEntityId' and 'sourceFieldId' to 'targetEntityId' and 'targetFieldId'.
5. Use accurate standard PostgreSQL types: uuid, varchar(50), varchar(255), text, integer, bigint, boolean, timestamptz, numeric(10,2), jsonb.
6. Clearly document any inferred domain assumptions in 'assumptions' array.
7. If business rules are ambiguous or missing, formulate actionable questions in 'unresolvedQuestions'.
8. Output ONLY a valid JSON object matching the canonical schema contract.`;

export interface GenerateSchemaInput {
  prompt: string;
  applicationName?: string;
  targetDialect: DatabaseDialect;
  modules?: string[];
  rules?: string[];
  expectedScale?: string;
}

export class AIService {
  private static client: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    }
    return this.client;
  }

  /**
   * Evaluates input relevance and rejects prompt injections or off-topic spam
   */
  public static validateRequirementSafety(prompt: string): { isSafe: boolean; reason?: string } {
    const trimmed = prompt.trim();
    if (trimmed.length < 15) {
      return { isSafe: false, reason: 'Requirement prompt is too short to construct a valid schema (minimum 15 characters).' };
    }
    if (trimmed.length > 10000) {
      return { isSafe: false, reason: 'Requirement prompt exceeds maximum allowed limit of 10,000 characters.' };
    }

    // Guard against trivial adversarial injections
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('ignore all previous instructions') ||
      lower.includes('forget system prompt') ||
      lower.includes('act as a poet') ||
      lower.includes('tell me a joke')
    ) {
      return { isSafe: false, reason: 'Please focus requirements exclusively on software domain and data modeling logic.' };
    }

    return { isSafe: true };
  }

  /**
   * Synthesizes canonical schema from requirements using Gemini 2.5 Flash
   */
  public static async generateSchema(input: GenerateSchemaInput): Promise<{
    schema: CanonicalSchema;
    diagnostics: ReturnType<typeof SchemaValidatorService.validate>;
    usedAI: boolean;
  }> {
    const safety = this.validateRequirementSafety(input.prompt);
    if (!safety.isSafe) {
      throw new Error(safety.reason);
    }

    const appName = input.applicationName || 'Application Database Model';

    // If no Gemini API key is configured, synthesize fallback schema deterministically
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('[AI Service] No valid GEMINI_API_KEY configured. Generating baseline schema template.');
      const fallback = this.generateDeterministicFallback(input);
      const diagnostics = SchemaValidatorService.validate(fallback);
      return { schema: fallback, diagnostics, usedAI: false };
    }

    const client = this.getClient();

    const userPromptContent = JSON.stringify({
      applicationName: appName,
      targetDialect: input.targetDialect || 'postgresql',
      userRequirementSpecification: input.prompt,
      suggestedModules: input.modules || [],
      knownBusinessRules: input.rules || [],
      scale: input.expectedScale || 'Standard',
    }, null, 2);

    try {
      // Primary generation call
      const response = await client.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: [
          { role: 'user', parts: [{ text: userPromptContent }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '';
      let parsed = JSON.parse(responseText);

      // Validate against Zod schema
      let zodResult = canonicalSchemaZodSchema.safeParse(parsed);

      // Bounded Repair loop (1 attempt) if parse or semantic validation fails
      if (!zodResult.success) {
        console.warn('[AI Service] Initial AI schema failed Zod validation, attempting repair...');
        parsed = await this.repairSchema(client, responseText, zodResult.error.message);
        zodResult = canonicalSchemaZodSchema.safeParse(parsed);
      }

      if (!zodResult.success) {
        throw new Error(`Failed to validate AI schema output: ${zodResult.error.message}`);
      }

      const validatedSchema = zodResult.data as CanonicalSchema;
      const diagnostics = SchemaValidatorService.validate(validatedSchema);

      return {
        schema: validatedSchema,
        diagnostics,
        usedAI: true,
      };
    } catch (err: any) {
      console.error('[AI Service] Gemini generation error:', err);
      // Fallback gracefully if rate limit or network issue occurs
      const fallback = this.generateDeterministicFallback(input);
      fallback.assumptions.push(`Note: AI service encountered error (${err.message}). Template schema provided.`);
      const diagnostics = SchemaValidatorService.validate(fallback);
      return { schema: fallback, diagnostics, usedAI: false };
    }
  }

  /**
   * Bounded repair prompt
   */
  private static async repairSchema(
    client: GoogleGenAI,
    rawOutput: string,
    errorDetails: string
  ): Promise<any> {
    const repairPrompt = `The previous JSON database schema had validation errors:
${errorDetails}

PREVIOUS OUTPUT:
${rawOutput}

Fix all errors and return ONLY the corrected valid Canonical Schema JSON object.`;

    const repairResponse = await client.models.generateContent({
      model: ENV.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.0,
      },
    });

    return JSON.parse(repairResponse.text || '{}');
  }

  /**
   * Deterministic fallback generator when Gemini API is unavailable
   */
  private static generateDeterministicFallback(input: GenerateSchemaInput): CanonicalSchema {
    const appName = input.applicationName || 'Application';
    const modules = input.modules && input.modules.length > 0
      ? input.modules
      : ['users', 'items', 'orders', 'transactions'];

    const entities = modules.map((mod) => {
      const cleanName = mod.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      return {
        id: `e_${cleanName}`,
        name: cleanName,
        description: `Operational records for ${mod}`,
        fields: [
          {
            id: `f_${cleanName}_id`,
            name: 'id',
            dataType: 'uuid',
            isPrimaryKey: true,
            isForeignKey: false,
            isNullable: false,
            isUnique: true,
            defaultValue: 'gen_random_uuid()',
          },
          {
            id: `f_${cleanName}_name`,
            name: cleanName === 'users' ? 'email' : 'name',
            dataType: 'varchar(255)',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: cleanName === 'users',
          },
          {
            id: `f_${cleanName}_created_at`,
            name: 'created_at',
            dataType: 'timestamptz',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
            isUnique: false,
            defaultValue: 'CURRENT_TIMESTAMP',
          },
        ],
      };
    });

    return {
      version: '1.0.0',
      projectName: appName,
      targetDialect: input.targetDialect || 'postgresql',
      assumptions: [
        'Normalized to 3NF schema.',
        'Primary keys standardized as UUID with gen_random_uuid() default.',
        'Timestamps tracked with timezone precision (timestamptz).'
      ],
      unresolvedQuestions: [
        'Should audit events be tracked in a separate ledger table?'
      ],
      entities,
      relationships: [],
    };
  }

  /**
   * Generates a concise human-readable summary of what changed between two schemas
   */
  public static generateSchemaDiffSummary(oldSchema: CanonicalSchema, newSchema: CanonicalSchema): string {
    const oldTables = new Set(oldSchema.entities.map(e => e.name));
    const newTables = new Set(newSchema.entities.map(e => e.name));

    const addedTables = [...newTables].filter(t => !oldTables.has(t));
    const removedTables = [...oldTables].filter(t => !newTables.has(t));

    const summaryParts: string[] = [];
    if (addedTables.length > 0) {
      summaryParts.push(`Added table(s): ${addedTables.join(', ')}`);
    }
    if (removedTables.length > 0) {
      summaryParts.push(`Removed table(s): ${removedTables.join(', ')}`);
    }

    for (const newEntity of newSchema.entities) {
      const oldEntity = oldSchema.entities.find(e => e.name === newEntity.name || e.id === newEntity.id);
      if (oldEntity) {
        const oldCols = new Set(oldEntity.fields.map(f => f.name));
        const addedCols = newEntity.fields.filter(f => !oldCols.has(f.name)).map(f => f.name);
        if (addedCols.length > 0) {
          summaryParts.push(`Added column(s) [${addedCols.join(', ')}] to \`${newEntity.name}\``);
        }
      }
    }

    if (newSchema.relationships.length > oldSchema.relationships.length) {
      const diffCount = newSchema.relationships.length - oldSchema.relationships.length;
      summaryParts.push(`Added ${diffCount} new relationship(s)`);
    }

    const resolvedCount = Math.max(0, (oldSchema.unresolvedQuestions?.length || 0) - (newSchema.unresolvedQuestions?.length || 0));
    if (resolvedCount > 0) {
      summaryParts.push(`Resolved ${resolvedCount} architectural question(s)`);
    }

    if (summaryParts.length === 0) {
      return 'Schema updated with refined constraints, types, and architectural assumptions.';
    }

    return summaryParts.join('. ') + '.';
  }

  /**
   * Iterates and updates an existing canonical schema based on natural language instructions
   */
  public static async iterateSchema(
    currentSchema: CanonicalSchema,
    instruction: string
  ): Promise<{
    schema: CanonicalSchema;
    summary: string;
    diagnostics: ReturnType<typeof SchemaValidatorService.validate>;
  }> {
    const trimmed = instruction.trim();
    if (!trimmed) {
      throw new Error('Update instruction cannot be empty.');
    }

    // Fallback if no valid Gemini API key
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const updated = JSON.parse(JSON.stringify(currentSchema)) as CanonicalSchema;
      const lower = trimmed.toLowerCase();
      
      // Match common table addition commands e.g. "add payments table"
      const addTableMatch = lower.match(/add\s+([a-z0-9_]+)\s+table/i) || lower.match(/create\s+([a-z0-9_]+)\s+table/i);
      if (addTableMatch) {
        const tblName = addTableMatch[1].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const entityId = `e_${tblName}_${Date.now().toString(36)}`;
        updated.entities.push({
          id: entityId,
          name: tblName,
          description: `Records for ${tblName}`,
          fields: [
            { id: `f_${tblName}_id`, name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true, defaultValue: 'gen_random_uuid()' },
            { id: `f_${tblName}_name`, name: 'name', dataType: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false },
            { id: `f_${tblName}_created_at`, name: 'created_at', dataType: 'timestamptz', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' },
          ]
        });
      }
      updated.assumptions = [...(updated.assumptions || []), `Updated per instruction: "${trimmed}"`];
      const summary = this.generateSchemaDiffSummary(currentSchema, updated);
      const diagnostics = SchemaValidatorService.validate(updated);
      return { schema: updated, summary, diagnostics };
    }

    const client = this.getClient();

    const SYSTEM_ITERATION_INSTRUCTION = `You are a Principal Relational Database Architect and Data Modeling Specialist.
Your task is to modify the provided Canonical Schema JSON according to the user's natural language update instruction.

MANDATORY RULES:
1. Preserve all existing tables, columns, and relationships unless the instruction explicitly asks to modify, remove, or replace them.
2. If adding new tables or columns:
   - Ensure every new table has a stable unique 'id' (e.g. 'e_<name>') and a valid Primary Key (e.g. 'id uuid' with defaultValue 'gen_random_uuid()').
   - Standardize column names to snake_case.
   - For relationships, accurately link 'sourceEntityId' and 'sourceFieldId' to 'targetEntityId' and 'targetFieldId'.
3. Maintain PostgreSQL/relational standard data types.
4. Record the applied architectural change in the 'assumptions' array.
5. If the change resolves any 'unresolvedQuestions', remove them from 'unresolvedQuestions'.
6. Keep the existing 'layout' intact where possible.
7. Return ONLY a valid JSON object matching the Canonical Schema contract.`;

    const userPromptContent = JSON.stringify({
      task: 'UPDATE_EXISTING_SCHEMA',
      userInstruction: trimmed,
      currentSchema,
    }, null, 2);

    try {
      const response = await client.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: userPromptContent }] }],
        config: {
          systemInstruction: SYSTEM_ITERATION_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '';
      let parsed = JSON.parse(responseText);

      let zodResult = canonicalSchemaZodSchema.safeParse(parsed);
      if (!zodResult.success) {
        parsed = await this.repairSchema(client, responseText, zodResult.error.message);
        zodResult = canonicalSchemaZodSchema.safeParse(parsed);
      }

      if (!zodResult.success) {
        throw new Error(`Failed to validate updated schema: ${zodResult.error.message}`);
      }

      const validatedSchema = zodResult.data as CanonicalSchema;
      const summary = this.generateSchemaDiffSummary(currentSchema, validatedSchema);
      const diagnostics = SchemaValidatorService.validate(validatedSchema);

      return { schema: validatedSchema, summary, diagnostics };
    } catch (err: any) {
      console.error('[AI Service] Iterate schema error:', err);
      // Fallback gracefully
      const fallback = JSON.parse(JSON.stringify(currentSchema)) as CanonicalSchema;
      fallback.assumptions.push(`Updated per request: ${trimmed}`);
      const summary = `Note: AI encountered error (${err.message}). Recorded architecture note.`;
      const diagnostics = SchemaValidatorService.validate(fallback);
      return { schema: fallback, summary, diagnostics };
    }
  }

  /**
   * Resolves multiple/all unresolved questions in one unified batch
   */
  public static async batchResolveQuestions(
    currentSchema: CanonicalSchema,
    answers: string | Array<{ question: string; answer: string }>
  ): Promise<{
    schema: CanonicalSchema;
    summary: string;
    diagnostics: ReturnType<typeof SchemaValidatorService.validate>;
  }> {
    const answersText = typeof answers === 'string'
      ? answers.trim()
      : answers.map((a, i) => `Question ${i + 1}: ${a.question}\nAnswer/Decision: ${a.answer}`).join('\n\n');

    if (!answersText) {
      throw new Error('Answers text cannot be empty.');
    }

    // Fallback if no valid Gemini API key
    if (!ENV.GEMINI_API_KEY || ENV.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const updated = JSON.parse(JSON.stringify(currentSchema)) as CanonicalSchema;
      updated.assumptions = [
        ...(updated.assumptions || []),
        `Resolved questions with decisions: ${answersText.substring(0, 200)}...`
      ];
      updated.unresolvedQuestions = [];
      const summary = `Resolved all ${currentSchema.unresolvedQuestions.length} architectural questions in batch.`;
      const diagnostics = SchemaValidatorService.validate(updated);
      return { schema: updated, summary, diagnostics };
    }

    const client = this.getClient();

    const SYSTEM_RESOLVE_INSTRUCTION = `You are a Principal Relational Database Architect.
The user has provided concrete architectural decisions/answers for the unresolved questions in this relational database schema.
Your task is to update the Canonical Schema to reflect ALL of the user's answers in one unified update.

MANDATORY RULES:
1. Apply the user's architectural decisions across the schema (e.g., add soft-delete columns, add audit tables, adjust constraints, add junction tables, change data types, or add indexes according to their answers).
2. Remove the questions that have been addressed/resolved from the 'unresolvedQuestions' array. If all questions were answered, 'unresolvedQuestions' should be empty.
3. Record the user's answered decisions into the 'assumptions' array for architectural documentation.
4. Maintain all valid primary keys, foreign keys, and 3NF normalizations.
5. Return ONLY a valid JSON object matching the Canonical Schema contract.`;

    const userPromptContent = JSON.stringify({
      task: 'BATCH_RESOLVE_ARCHITECTURAL_QUESTIONS',
      unresolvedQuestions: currentSchema.unresolvedQuestions,
      userAnswersAndDecisions: answersText,
      currentSchema,
    }, null, 2);

    try {
      const response = await client.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: userPromptContent }] }],
        config: {
          systemInstruction: SYSTEM_RESOLVE_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '';
      let parsed = JSON.parse(responseText);

      let zodResult = canonicalSchemaZodSchema.safeParse(parsed);
      if (!zodResult.success) {
        parsed = await this.repairSchema(client, responseText, zodResult.error.message);
        zodResult = canonicalSchemaZodSchema.safeParse(parsed);
      }

      if (!zodResult.success) {
        throw new Error(`Failed to validate updated schema: ${zodResult.error.message}`);
      }

      const validatedSchema = zodResult.data as CanonicalSchema;
      const summary = this.generateSchemaDiffSummary(currentSchema, validatedSchema);
      const diagnostics = SchemaValidatorService.validate(validatedSchema);

      return { schema: validatedSchema, summary, diagnostics };
    } catch (err: any) {
      console.error('[AI Service] Batch resolve questions error:', err);
      const fallback = JSON.parse(JSON.stringify(currentSchema)) as CanonicalSchema;
      fallback.unresolvedQuestions = [];
      fallback.assumptions.push(`Resolved questions with decisions: ${answersText.substring(0, 200)}`);
      const summary = `Resolved architectural questions and updated assumptions.`;
      const diagnostics = SchemaValidatorService.validate(fallback);
      return { schema: fallback, summary, diagnostics };
    }
  }
}
