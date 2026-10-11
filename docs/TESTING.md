# TESTING.md — Test Strategy, Test Cases & Acceptance Suite

## 1. Testing Philosophy
Schema Studio AI requires high reliability because corrupted schemas lead to failed database migrations. We test at three distinct levels:
1. **Unit Tests**: Pure function tests for SQL generation, dependency sorting (topological order), canonical schema validation, and identifier quoting.
2. **Integration Tests**: API route tests with mock auth and database layers, verifying validation, ownership restrictions, and generation error handling.
3. **Acceptance Benchmark Tests**: Curated software domain prompts (E-commerce, Healthcare, Multi-tenant SaaS, Social Network) tested against schema invariants.

## 2. Core Invariant Acceptance Suite

| ID | Test Category | Scenario | Expected Behavior |
|---|---|---|---|
| **INV-01** | Primary Keys | Table without Primary Key | Validator produces diagnostic error; auto-repair or user inspector alerts. |
| **INV-02** | Foreign Keys | FK pointing to non-existent table | Validator flags orphaned reference; export blocks invalid constraint. |
| **INV-03** | Type Compatibility | UUID FK pointing to BIGINT PK | Validator emits type mismatch error. |
| **INV-04** | Topological Sort | Tables A -> B -> C with FK dependencies | SQL generator outputs table C, then B, then A so `CREATE TABLE` succeeds without dependency violation. |
| **INV-05** | Circular References | Table A references B, Table B references A | SQL generator detects cycle, outputs tables first, followed by `ALTER TABLE ... ADD CONSTRAINT` after creation. |
| **INV-06** | M:N Relationship | User & Role many-to-many | Generates intermediate junction table (e.g., `user_roles`) with composite PK. |
| **INV-07** | Prompt Injection | Malicious instruction in prompt | Request treated strictly as requirements text; no system instruction override. |
| **INV-08** | Unauthorized Access | User X attempts to patch User Y project | HTTP 403 Forbidden returned. |

## 3. Test Commands
```bash
# Run unit & schema tests
npm run test

# Run frontend tests
npm run test:client

# Run backend tests
npm run test:server
```
