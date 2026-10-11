import { CanonicalSchema, Entity, Relationship } from '../types/schema';

/**
 * Escapes standard SQL identifiers with double quotes
 */
export function escapeIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Maps schema data types to standard PostgreSQL DDL types
 */
export function mapToPostgresType(dataType: string): string {
  const dt = dataType.trim().toLowerCase();
  if (dt === 'string' || dt === 'varchar') return 'VARCHAR(255)';
  if (dt === 'int' || dt === 'integer') return 'INTEGER';
  if (dt === 'long' || dt === 'bigint') return 'BIGINT';
  if (dt === 'bool' || dt === 'boolean') return 'BOOLEAN';
  if (dt === 'datetime' || dt === 'timestamp') return 'TIMESTAMPTZ';
  if (dt === 'float' || dt === 'double') return 'DOUBLE PRECISION';
  if (dt === 'decimal' || dt === 'number') return 'NUMERIC(10,2)';
  return dataType.toUpperCase();
}

/**
 * Performs topological sort on entities to avoid foreign key dependency ordering issues.
 * Returns sorted entities, and an array of any remaining cyclic relationships.
 */
export function sortEntitiesByDependency(
  entities: Entity[],
  relationships: Relationship[]
): { sorted: Entity[]; cyclicRelationships: Relationship[] } {
  const entityMap = new Map<string, Entity>(entities.map((e) => [e.id, e]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  entities.forEach((e) => {
    inDegree.set(e.id, 0);
    adj.set(e.id, []);
  });

  // Self-references or cycles
  const directRels: Relationship[] = [];
  const cyclicRels: Relationship[] = [];

  relationships.forEach((rel) => {
    // Child references Parent
    // Table containing FK (source) depends on Table containing PK (target)
    if (rel.sourceEntityId === rel.targetEntityId) {
      // Self reference (e.g. employee.manager_id -> employee.id)
      cyclicRels.push(rel);
    } else if (entityMap.has(rel.sourceEntityId) && entityMap.has(rel.targetEntityId)) {
      directRels.push(rel);
      adj.get(rel.targetEntityId)!.push(rel.sourceEntityId);
      inDegree.set(rel.sourceEntityId, (inDegree.get(rel.sourceEntityId) || 0) + 1);
    }
  });

  // Kahn's Algorithm
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sortedIds: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedIds.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Any remaining entities with inDegree > 0 belong to a cycle
  const sorted: Entity[] = [];
  const processed = new Set<string>();

  sortedIds.forEach((id) => {
    const entity = entityMap.get(id);
    if (entity) {
      sorted.push(entity);
      processed.add(id);
    }
  });

  // Append remaining entities involved in cycles
  entities.forEach((entity) => {
    if (!processed.has(entity.id)) {
      sorted.push(entity);
    }
  });

  // Find relationships that caused cycles to output as ALTER TABLE statements
  const remainingIds = new Set(entities.map((e) => e.id).filter((id) => !sortedIds.includes(id)));
  directRels.forEach((rel) => {
    if (remainingIds.has(rel.sourceEntityId) && remainingIds.has(rel.targetEntityId)) {
      cyclicRels.push(rel);
    }
  });

  return { sorted, cyclicRelationships: cyclicRels };
}

/**
 * Deterministically generates PostgreSQL DDL from CanonicalSchema
 */
export function generatePostgresDDL(schema: CanonicalSchema): string {
  const lines: string[] = [];

  lines.push(`-- ==============================================================================`);
  lines.push(`-- Schema Studio AI — PostgreSQL DDL Generator`);
  lines.push(`-- Project: ${schema.projectName}`);
  lines.push(`-- Dialect: ${schema.targetDialect.toUpperCase()}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- ==============================================================================\n`);

  lines.push(`-- Ensure UUID extension if UUIDs are used`);
  const usesUuid = schema.entities.some((e) =>
    e.fields.some((f) => f.dataType.toLowerCase().includes('uuid'))
  );
  if (usesUuid) {
    lines.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`);
  }

  const { sorted, cyclicRelationships } = sortEntitiesByDependency(
    schema.entities,
    schema.relationships
  );

  const cyclicRelSet = new Set(cyclicRelationships.map((r) => r.id));

  // Generate CREATE TABLE for each entity
  sorted.forEach((entity) => {
    if (entity.description) {
      lines.push(`-- ${entity.description}`);
    }
    lines.push(`CREATE TABLE IF NOT EXISTS ${escapeIdent(entity.name)} (`);

    const fieldDefs: string[] = [];

    // Fields
    entity.fields.forEach((field) => {
      let def = `  ${escapeIdent(field.name)} ${mapToPostgresType(field.dataType)}`;

      if (field.isPrimaryKey && (!entity.compositePrimaryKey || entity.compositePrimaryKey.length === 0)) {
        def += ' PRIMARY KEY';
      }

      if (!field.isNullable && !field.isPrimaryKey) {
        def += ' NOT NULL';
      }

      if (field.isUnique && !field.isPrimaryKey) {
        def += ' UNIQUE';
      }

      if (field.defaultValue) {
        def += ` DEFAULT ${field.defaultValue}`;
      }

      if (field.checkExpression) {
        def += ` CHECK (${field.checkExpression})`;
      }

      fieldDefs.push(def);
    });

    // Composite primary key
    if (entity.compositePrimaryKey && entity.compositePrimaryKey.length > 0) {
      const pkColNames = entity.compositePrimaryKey
        .map((fId) => {
          const f = entity.fields.find((field) => field.id === fId || field.name === fId);
          return f ? escapeIdent(f.name) : null;
        })
        .filter(Boolean);

      if (pkColNames.length > 0) {
        fieldDefs.push(`  PRIMARY KEY (${pkColNames.join(', ')})`);
      }
    }

    // Direct Foreign Keys (non-cyclic)
    const directEntityFKs = schema.relationships.filter(
      (rel) => rel.sourceEntityId === entity.id && !cyclicRelSet.has(rel.id)
    );

    directEntityFKs.forEach((rel) => {
      const sourceCol = entity.fields.find((f) => f.id === rel.sourceFieldId || f.name === rel.sourceFieldId);
      const targetEntity = schema.entities.find((e) => e.id === rel.targetEntityId);
      const targetCol = targetEntity?.fields.find((f) => f.id === rel.targetFieldId || f.name === rel.targetFieldId);

      if (sourceCol && targetEntity && targetCol) {
        const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : ' ON DELETE CASCADE';
        const onUpdate = rel.onUpdate ? ` ON UPDATE ${rel.onUpdate}` : ' ON UPDATE CASCADE';
        const fkConstraintName = `fk_${entity.name}_${sourceCol.name}`;
        fieldDefs.push(
          `  CONSTRAINT ${escapeIdent(fkConstraintName)} FOREIGN KEY (${escapeIdent(sourceCol.name)}) REFERENCES ${escapeIdent(targetEntity.name)} (${escapeIdent(targetCol.name)})${onDelete}${onUpdate}`
        );
      }
    });

    // Check constraints
    if (entity.checks && entity.checks.length > 0) {
      entity.checks.forEach((chk) => {
        fieldDefs.push(`  CONSTRAINT ${escapeIdent(chk.name)} CHECK (${chk.expression})`);
      });
    }

    lines.push(fieldDefs.join(',\n'));
    lines.push(`);\n`);

    // Add table and column comments
    if (entity.description) {
      lines.push(`COMMENT ON TABLE ${escapeIdent(entity.name)} IS '${entity.description.replace(/'/g, "''")}';`);
    }
    entity.fields.forEach((field) => {
      if (field.comment) {
        lines.push(`COMMENT ON COLUMN ${escapeIdent(entity.name)}.${escapeIdent(field.name)} IS '${field.comment.replace(/'/g, "''")}';`);
      }
    });

    // Table Indexes
    if (entity.indexes && entity.indexes.length > 0) {
      entity.indexes.forEach((idx) => {
        const idxCols = idx.fields
          .map((fId) => {
            const f = entity.fields.find((field) => field.id === fId || field.name === fId);
            return f ? escapeIdent(f.name) : null;
          })
          .filter(Boolean);

        if (idxCols.length > 0) {
          const uniquePart = idx.isUnique ? 'UNIQUE ' : '';
          const typePart = idx.type ? ` USING ${idx.type.toUpperCase()}` : '';
          lines.push(`CREATE ${uniquePart}INDEX IF NOT EXISTS ${escapeIdent(idx.name)} ON ${escapeIdent(entity.name)}${typePart} (${idxCols.join(', ')});`);
        }
      });
    }

    lines.push('');
  });

  // Add cyclic / deferred foreign keys using ALTER TABLE
  if (cyclicRelationships.length > 0) {
    lines.push(`-- ==============================================================================`);
    lines.push(`-- Deferred / Cyclic Foreign Key Constraints`);
    lines.push(`-- ==============================================================================`);

    cyclicRelationships.forEach((rel) => {
      const sourceEntity = schema.entities.find((e) => e.id === rel.sourceEntityId);
      const targetEntity = schema.entities.find((e) => e.id === rel.targetEntityId);
      const sourceCol = sourceEntity?.fields.find((f) => f.id === rel.sourceFieldId || f.name === rel.sourceFieldId);
      const targetCol = targetEntity?.fields.find((f) => f.id === rel.targetFieldId || f.name === rel.targetFieldId);

      if (sourceEntity && targetEntity && sourceCol && targetCol) {
        const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : ' ON DELETE CASCADE';
        const onUpdate = rel.onUpdate ? ` ON UPDATE ${rel.onUpdate}` : ' ON UPDATE CASCADE';
        const fkConstraintName = `fk_${sourceEntity.name}_${sourceCol.name}_deferred`;
        lines.push(
          `ALTER TABLE ${escapeIdent(sourceEntity.name)} ADD CONSTRAINT ${escapeIdent(fkConstraintName)} FOREIGN KEY (${escapeIdent(sourceCol.name)}) REFERENCES ${escapeIdent(targetEntity.name)} (${escapeIdent(targetCol.name)})${onDelete}${onUpdate};`
        );
      }
    });
    lines.push('');
  }

  return lines.join('\n');
}
