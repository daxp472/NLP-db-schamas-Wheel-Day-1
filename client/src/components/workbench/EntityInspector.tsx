import React, { useState } from 'react';
import {
  Link as LinkIcon,
  Trash2,
  Plus,
  HelpCircle,
  Info,
  Sliders,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Entity, Field, Relationship, CommonSQLDataType } from '@schema-studio/shared';
import { cn } from '../../utils/cn';

const SQL_TYPES: CommonSQLDataType[] = [
  'uuid',
  'bigint',
  'integer',
  'smallint',
  'serial',
  'bigserial',
  'varchar(255)',
  'varchar(100)',
  'varchar(50)',
  'text',
  'boolean',
  'timestamptz',
  'timestamp',
  'date',
  'time',
  'numeric(10,2)',
  'numeric(12,4)',
  'jsonb',
  'json',
  'bytea',
];

interface EntityInspectorProps {
  entity: Entity | null;
  allEntities: Entity[];
  relationships: Relationship[];
  assumptions: string[];
  unresolvedQuestions: string[];
  onUpdateEntity: (entity: Entity) => void;
  onDeleteEntity: (entityId: string) => void;
  onUpdateRelationship: (relationship: Relationship) => void;
  onDeleteRelationship: (relationshipId: string) => void;
  onAddRelationship?: (rel: Partial<Relationship>) => void;
  onOpenUnresolvedModal?: () => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  entity,
  allEntities,
  relationships,
  assumptions,
  unresolvedQuestions,
  onUpdateEntity,
  onDeleteEntity,
  onUpdateRelationship,
  onDeleteRelationship,
  onOpenUnresolvedModal,
}) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'relationships' | 'rationale'>('columns');

  if (!entity) {
    return (
      <aside className="w-80 border-l border-workbench-border bg-workbench-surface p-6 flex flex-col items-center justify-center text-center text-workbench-muted select-none">
        <Database className="w-10 h-10 mb-3 text-workbench-border-active" />
        <h3 className="font-semibold text-sm text-workbench-text mb-1">No Entity Selected</h3>
        <p className="text-xs text-workbench-muted">
          Select a table on the ER Canvas or in the Schema Explorer to inspect and edit its fields, keys, and foreign relationships.
        </p>
      </aside>
    );
  }

  // Related relationships
  const entityRelationships = relationships.filter(
    (r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id
  );

  // Field manipulation helpers
  const handleAddField = () => {
    const newField: Field = {
      id: `f_${entity.name}_col_${Date.now().toString().slice(-4)}`,
      name: `new_column_${entity.fields.length + 1}`,
      dataType: 'varchar(255)',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: true,
      isUnique: false,
    };
    onUpdateEntity({
      ...entity,
      fields: [...entity.fields, newField],
    });
  };

  const handleUpdateField = (fieldIndex: number, updates: Partial<Field>) => {
    const updatedFields = [...entity.fields];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };
    onUpdateEntity({
      ...entity,
      fields: updatedFields,
    });
  };

  const handleDeleteField = (fieldIndex: number) => {
    const fieldToDelete = entity.fields[fieldIndex];
    if (fieldToDelete.isPrimaryKey && entity.fields.filter((f) => f.isPrimaryKey).length === 1) {
      if (!confirm(`Warning: Deleting the only primary key '${fieldToDelete.name}' will make this table invalid. Proceed?`)) {
        return;
      }
    }
    const updatedFields = entity.fields.filter((_, idx) => idx !== fieldIndex);
    onUpdateEntity({
      ...entity,
      fields: updatedFields,
    });
  };

  return (
    <aside className="w-84 border-l border-workbench-border bg-workbench-surface flex flex-col h-full text-xs select-none shrink-0 overflow-hidden">
      {/* Table Title and Actions */}
      <div className="p-3 border-b border-workbench-border bg-workbench-elevated">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-workbench-cyan" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-workbench-muted">
              Table Inspector
            </span>
          </div>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete table '${entity.name}'?`)) {
                onDeleteEntity(entity.id);
              }
            }}
            title="Delete this table"
            className="p-1 rounded text-red-400 hover:bg-workbench-bg hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Edit Table Name */}
        <input
          type="text"
          value={entity.name}
          onChange={(e) => onUpdateEntity({ ...entity, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
          className="w-full bg-workbench-bg border border-workbench-border rounded px-2.5 py-1 font-mono font-semibold text-workbench-heading focus:outline-none focus:border-workbench-cyan text-sm"
        />

        {/* Table Description */}
        <input
          type="text"
          value={entity.description || ''}
          onChange={(e) => onUpdateEntity({ ...entity, description: e.target.value })}
          placeholder="Table description or comment..."
          className="w-full mt-1.5 bg-transparent border-b border-workbench-border px-1 py-0.5 text-[11px] text-workbench-muted focus:outline-none focus:border-workbench-cyan truncate"
        />
      </div>

      {/* Tab selection */}
      <div className="flex border-b border-workbench-border bg-workbench-bg text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('columns')}
          className={cn(
            'flex-1 py-2 text-center transition-colors border-b-2',
            activeTab === 'columns'
              ? 'border-workbench-cyan text-workbench-cyan bg-workbench-surface'
              : 'border-transparent text-workbench-muted hover:text-workbench-text'
          )}
        >
          Columns ({entity.fields.length})
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          className={cn(
            'flex-1 py-2 text-center transition-colors border-b-2',
            activeTab === 'relationships'
              ? 'border-workbench-cyan text-workbench-cyan bg-workbench-surface'
              : 'border-transparent text-workbench-muted hover:text-workbench-text'
          )}
        >
          Relations ({entityRelationships.length})
        </button>
        <button
          onClick={() => setActiveTab('rationale')}
          className={cn(
            'flex-1 py-2 text-center transition-colors border-b-2',
            activeTab === 'rationale'
              ? 'border-workbench-cyan text-workbench-cyan bg-workbench-surface'
              : 'border-transparent text-workbench-muted hover:text-workbench-text'
          )}
        >
          Inferences
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'columns' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-workbench-muted">Defined Columns</span>
              <button
                onClick={handleAddField}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-workbench-elevated text-workbench-cyan hover:bg-workbench-overlay border border-workbench-border transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="space-y-2">
              {entity.fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-2.5 rounded bg-workbench-elevated/80 border border-workbench-border space-y-2 font-mono"
                >
                  {/* Name and Type Row */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        handleUpdateField(idx, {
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                        })
                      }
                      className="flex-1 bg-workbench-bg border border-workbench-border rounded px-2 py-1 text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan"
                    />

                    <select
                      value={field.dataType}
                      onChange={(e) => handleUpdateField(idx, { dataType: e.target.value })}
                      className="bg-workbench-bg border border-workbench-border rounded px-1.5 py-1 text-[11px] text-workbench-cyan focus:outline-none focus:border-workbench-cyan font-mono"
                    >
                      {SQL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteField(idx)}
                      title="Delete Column"
                      className="p-1 text-workbench-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Attributes and Constraints flags */}
                  <div className="flex items-center gap-3 text-[11px] font-sans pt-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isPrimaryKey}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            isPrimaryKey: e.target.checked,
                            isNullable: e.target.checked ? false : field.isNullable,
                          })
                        }
                        className="rounded border-workbench-border text-amber-400 focus:ring-0 bg-workbench-bg"
                      />
                      <span className={field.isPrimaryKey ? 'text-amber-400 font-semibold' : 'text-workbench-muted'}>
                        PK
                      </span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isNullable}
                        disabled={field.isPrimaryKey}
                        onChange={(e) => handleUpdateField(idx, { isNullable: e.target.checked })}
                        className="rounded border-workbench-border text-workbench-cyan focus:ring-0 bg-workbench-bg"
                      />
                      <span className="text-workbench-muted">Nullable</span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isUnique}
                        onChange={(e) => handleUpdateField(idx, { isUnique: e.target.checked })}
                        className="rounded border-workbench-border text-workbench-emerald focus:ring-0 bg-workbench-bg"
                      />
                      <span className={field.isUnique ? 'text-workbench-emerald font-semibold' : 'text-workbench-muted'}>
                        Unique
                      </span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isForeignKey}
                        onChange={(e) => handleUpdateField(idx, { isForeignKey: e.target.checked })}
                        className="rounded border-workbench-border text-workbench-violet focus:ring-0 bg-workbench-bg"
                      />
                      <span className={field.isForeignKey ? 'text-workbench-violet font-semibold' : 'text-workbench-muted'}>
                        FK
                      </span>
                    </label>
                  </div>

                  {/* Optional Default value */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] text-workbench-muted">Default:</span>
                    <input
                      type="text"
                      value={field.defaultValue || ''}
                      onChange={(e) => handleUpdateField(idx, { defaultValue: e.target.value || undefined })}
                      placeholder="e.g. gen_random_uuid(), 'active', 0"
                      className="flex-1 bg-workbench-bg border border-workbench-border rounded px-1.5 py-0.5 text-[10px] text-workbench-text focus:outline-none focus:border-workbench-cyan font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase text-workbench-muted block">
              Connected Foreign Keys
            </span>

            {entityRelationships.length === 0 ? (
              <div className="p-4 rounded border border-workbench-border bg-workbench-bg text-center text-workbench-muted text-xs">
                No foreign keys connected to this entity yet.
              </div>
            ) : (
              entityRelationships.map((rel) => {
                const isSource = rel.sourceEntityId === entity.id;
                const otherEntity = allEntities.find((e) =>
                  e.id === (isSource ? rel.targetEntityId : rel.sourceEntityId)
                );

                return (
                  <div
                    key={rel.id}
                    className="p-2.5 rounded bg-workbench-elevated border border-workbench-border space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-workbench-heading font-semibold">
                        <LinkIcon className="w-3.5 h-3.5 text-workbench-violet" />
                        <span>{isSource ? 'Outbound FK' : 'Inbound Reference'}</span>
                      </div>
                      <button
                        onClick={() => onDeleteRelationship(rel.id)}
                        className="text-workbench-muted hover:text-red-400 p-0.5 transition-colors"
                        title="Delete Relationship"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-workbench-muted">
                      <span>{isSource ? entity.name : otherEntity?.name}</span>
                      <ArrowRight className="w-3 h-3 text-workbench-cyan" />
                      <span>{isSource ? otherEntity?.name : entity.name}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-workbench-border/50">
                      <span>Cardinality:</span>
                      <select
                        value={rel.cardinality}
                        onChange={(e) =>
                          onUpdateRelationship({
                            ...rel,
                            cardinality: e.target.value as '1:1' | '1:N' | 'N:M',
                          })
                        }
                        className="bg-workbench-bg border border-workbench-border rounded px-1.5 py-0.5 text-workbench-cyan"
                      >
                        <option value="1:1">1 : 1</option>
                        <option value="1:N">1 : N</option>
                        <option value="N:M">N : M</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span>On Delete:</span>
                      <select
                        value={rel.onDelete || 'CASCADE'}
                        onChange={(e) =>
                          onUpdateRelationship({
                            ...rel,
                            onDelete: e.target.value as any,
                          })
                        }
                        className="bg-workbench-bg border border-workbench-border rounded px-1.5 py-0.5 text-workbench-text"
                      >
                        <option value="CASCADE">CASCADE</option>
                        <option value="RESTRICT">RESTRICT</option>
                        <option value="SET NULL">SET NULL</option>
                        <option value="NO ACTION">NO ACTION</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'rationale' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] uppercase text-workbench-cyan">
                <Info className="w-3.5 h-3.5" />
                <span>AI Inferred Assumptions</span>
              </div>
              {assumptions.length === 0 ? (
                <p className="text-workbench-muted text-xs italic">No assumptions recorded.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-workbench-text">
                  {assumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-workbench-bg p-2 rounded border border-workbench-border">
                      <span className="text-workbench-cyan shrink-0">•</span>
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-amber-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Unresolved Questions</span>
                </div>
                {unresolvedQuestions.length > 0 && onOpenUnresolvedModal && (
                  <button
                    onClick={onOpenUnresolvedModal}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1 transition-colors"
                    title="Answer all unresolved questions in one unified batch"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>Batch Resolve All</span>
                  </button>
                )}
              </div>
              {unresolvedQuestions.length === 0 ? (
                <p className="text-workbench-muted text-xs italic">All questions resolved.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-workbench-text">
                  {unresolvedQuestions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-workbench-bg p-2 rounded border border-amber-900/40 text-amber-200">
                      <span className="text-amber-400 shrink-0">?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
