import { describe, it, expect } from 'vitest';
import { 
  SAMPLE_ECOMMERCE_SCHEMA, 
  generatePostgresDDL, 
  sortEntitiesByDependency, 
  escapeIdent,
  mapToPostgresType,
  CanonicalSchema 
} from '@schema-studio/shared';

describe('PostgreSQL DDL Generator Engine', () => {
  it('correctly escapes SQL identifiers', () => {
    expect(escapeIdent('users')).toBe('"users"');
    expect(escapeIdent('order_items')).toBe('"order_items"');
    expect(escapeIdent('user"name')).toBe('"user""name"');
  });

  it('maps standard types to PostgreSQL types', () => {
    expect(mapToPostgresType('varchar')).toBe('VARCHAR(255)');
    expect(mapToPostgresType('string')).toBe('VARCHAR(255)');
    expect(mapToPostgresType('int')).toBe('INTEGER');
    expect(mapToPostgresType('bigint')).toBe('BIGINT');
    expect(mapToPostgresType('uuid')).toBe('UUID');
    expect(mapToPostgresType('datetime')).toBe('TIMESTAMPTZ');
  });

  it('sorts entities in topological dependency order (parents before children)', () => {
    const { sorted } = sortEntitiesByDependency(
      SAMPLE_ECOMMERCE_SCHEMA.entities,
      SAMPLE_ECOMMERCE_SCHEMA.relationships
    );

    const names = sorted.map((e) => e.name);
    // 'users' must come before 'orders' because orders references users
    expect(names.indexOf('users')).toBeLessThan(names.indexOf('orders'));
    // 'orders' and 'products' must come before 'order_items'
    expect(names.indexOf('orders')).toBeLessThan(names.indexOf('order_items'));
    expect(names.indexOf('products')).toBeLessThan(names.indexOf('order_items'));
  });

  it('handles circular references by deferring constraints to ALTER TABLE', () => {
    const circularSchema: CanonicalSchema = {
      version: '1.0.0',
      projectName: 'Circular Test',
      targetDialect: 'postgresql',
      assumptions: [],
      unresolvedQuestions: [],
      entities: [
        {
          id: 'e_departments',
          name: 'departments',
          fields: [
            { id: 'f_dept_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
            { id: 'f_dept_head_id', name: 'head_employee_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: true, isUnique: false },
          ]
        },
        {
          id: 'e_employees',
          name: 'employees',
          fields: [
            { id: 'f_emp_id', name: 'id', dataType: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false, isUnique: true },
            { id: 'f_emp_dept_id', name: 'department_id', dataType: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false, isUnique: false },
          ]
        }
      ],
      relationships: [
        {
          id: 'rel_emp_dept',
          sourceEntityId: 'e_employees',
          sourceFieldId: 'f_emp_dept_id',
          targetEntityId: 'e_departments',
          targetFieldId: 'f_dept_id',
          cardinality: '1:N',
        },
        {
          id: 'rel_dept_head',
          sourceEntityId: 'e_departments',
          sourceFieldId: 'f_dept_head_id',
          targetEntityId: 'e_employees',
          targetFieldId: 'f_emp_id',
          cardinality: '1:1',
        }
      ]
    };

    const ddl = generatePostgresDDL(circularSchema);
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "departments"');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "employees"');
    expect(ddl).toContain('ALTER TABLE');
    expect(ddl).toContain('ADD CONSTRAINT');
  });

  it('generates complete PostgreSQL DDL from sample ecommerce schema', () => {
    const ddl = generatePostgresDDL(SAMPLE_ECOMMERCE_SCHEMA);
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "orders"');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "products"');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS "order_items"');
    expect(ddl).toContain('PRIMARY KEY');
    expect(ddl).toContain('FOREIGN KEY');
    expect(ddl).toContain('REFERENCES "users"');
  });
});
