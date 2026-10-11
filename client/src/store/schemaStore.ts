import { 
  CanonicalSchema, 
  Entity, 
  ValidationReport
} from '@schema-studio/shared';

export interface SchemaStudioState {
  schema: CanonicalSchema;
  history: CanonicalSchema[];
  historyIndex: number;
  selectedEntityId: string | null;
  selectedFieldId: string | null;
  selectedRelationshipId: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  activeDrawerTab: 'sql' | 'diagnostics' | 'docs' | 'history' | null;
}

// Client-side deterministic database validation
export function validateCanonicalSchema(schema: CanonicalSchema): ValidationReport {
  const errors: ValidationReport['errors'] = [];
  const warnings: ValidationReport['warnings'] = [];
  const infos: ValidationReport['infos'] = [];

  const entityMap = new Map<string, Entity>();
  const entityNameSet = new Set<string>();

  // Entity-level checks
  schema.entities.forEach((entity) => {
    if (entityNameSet.has(entity.name.toLowerCase())) {
      errors.push({
        id: `dup_entity_${entity.id}`,
        severity: 'error',
        code: 'DUPLICATE_ENTITY_NAME',
        message: `Duplicate table name '${entity.name}' detected.`,
        entityId: entity.id,
      });
    }
    entityNameSet.add(entity.name.toLowerCase());
    entityMap.set(entity.id, entity);

    // Primary Key check
    const pkFields = entity.fields.filter((f) => f.isPrimaryKey);
    if (pkFields.length === 0 && (!entity.compositePrimaryKey || entity.compositePrimaryKey.length === 0)) {
      errors.push({
        id: `no_pk_${entity.id}`,
        severity: 'error',
        code: 'MISSING_PRIMARY_KEY',
        message: `Table '${entity.name}' does not have a primary key defined.`,
        entityId: entity.id,
      });
    }

    // Column name uniqueness and nullability of PK
    const colNames = new Set<string>();
    entity.fields.forEach((field) => {
      if (colNames.has(field.name.toLowerCase())) {
        errors.push({
          id: `dup_col_${field.id}`,
          severity: 'error',
          code: 'DUPLICATE_COLUMN_NAME',
          message: `Duplicate column '${field.name}' in table '${entity.name}'.`,
          entityId: entity.id,
          fieldId: field.id,
        });
      }
      colNames.add(field.name.toLowerCase());

      if (field.isPrimaryKey && field.isNullable) {
        errors.push({
          id: `nullable_pk_${field.id}`,
          severity: 'error',
          code: 'NULLABLE_PRIMARY_KEY',
          message: `Primary key column '${field.name}' in '${entity.name}' cannot be nullable.`,
          entityId: entity.id,
          fieldId: field.id,
        });
      }

      if (field.isForeignKey && !field.comment && !field.defaultValue) {
        // Warning: recommend index on foreign key
        const hasIndex = entity.indexes?.some((idx) => idx.fields.includes(field.id) || idx.fields.includes(field.name));
        if (!hasIndex) {
          warnings.push({
            id: `fk_no_index_${field.id}`,
            severity: 'warning',
            code: 'FOREIGN_KEY_NO_INDEX',
            message: `Foreign key '${field.name}' on '${entity.name}' has no index; consider indexing for JOIN performance.`,
            entityId: entity.id,
            fieldId: field.id,
          });
        }
      }
    });
  });

  // Relationship checks
  schema.relationships.forEach((rel) => {
    const sourceEntity = entityMap.get(rel.sourceEntityId);
    const targetEntity = entityMap.get(rel.targetEntityId);

    if (!sourceEntity) {
      errors.push({
        id: `orphaned_source_${rel.id}`,
        severity: 'error',
        code: 'ORPHANED_RELATIONSHIP',
        message: `Relationship references non-existent source entity '${rel.sourceEntityId}'.`,
        relationshipId: rel.id,
      });
      return;
    }

    if (!targetEntity) {
      errors.push({
        id: `orphaned_target_${rel.id}`,
        severity: 'error',
        code: 'ORPHANED_RELATIONSHIP',
        message: `Relationship references non-existent target entity '${rel.targetEntityId}'.`,
        relationshipId: rel.id,
      });
      return;
    }

    const sourceField = sourceEntity.fields.find((f) => f.id === rel.sourceFieldId || f.name === rel.sourceFieldId);
    const targetField = targetEntity.fields.find((f) => f.id === rel.targetFieldId || f.name === rel.targetFieldId);

    if (!sourceField) {
      errors.push({
        id: `missing_source_field_${rel.id}`,
        severity: 'error',
        code: 'MISSING_FK_FIELD',
        message: `FK column '${rel.sourceFieldId}' not found in table '${sourceEntity.name}'.`,
        relationshipId: rel.id,
      });
    }

    if (!targetField) {
      errors.push({
        id: `missing_target_field_${rel.id}`,
        severity: 'error',
        code: 'MISSING_PK_FIELD',
        message: `Referenced PK column '${rel.targetFieldId}' not found in table '${targetEntity.name}'.`,
        relationshipId: rel.id,
      });
    }

    if (sourceField && targetField) {
      // Basic type match warning
      const normSource = sourceField.dataType.toLowerCase().split('(')[0];
      const normTarget = targetField.dataType.toLowerCase().split('(')[0];
      if (normSource !== normTarget && !(normSource === 'bigint' && normTarget === 'bigserial') && !(normSource === 'integer' && normTarget === 'serial')) {
        warnings.push({
          id: `type_mismatch_${rel.id}`,
          severity: 'warning',
          code: 'TYPE_MISMATCH',
          message: `FK type '${sourceField.dataType}' in '${sourceEntity.name}.${sourceField.name}' may not match PK type '${targetField.dataType}' in '${targetEntity.name}.${targetField.name}'.`,
          relationshipId: rel.id,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    infos,
  };
}
