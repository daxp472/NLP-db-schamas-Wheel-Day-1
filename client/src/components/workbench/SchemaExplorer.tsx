import React, { useState } from 'react';
import {
  Search,
  Plus,
  Table as TableIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { Entity } from '@schema-studio/shared';
import { cn } from '../../utils/cn';

interface SchemaExplorerProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (entityId: string) => void;
  onAddTable: (tableName: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  onAddTable,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const filteredEntities = entities.filter((entity) =>
    entity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const cleanName = newTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    onAddTable(cleanName);
    setNewTableName('');
    setIsAdding(false);
  };

  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-workbench-border bg-workbench-surface flex flex-col items-center py-3 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-workbench-elevated text-workbench-muted hover:text-workbench-cyan transition-colors"
          title="Expand Schema Explorer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-4 rotate-90 text-[11px] font-mono tracking-wider text-workbench-muted uppercase whitespace-nowrap">
          Tables ({entities.length})
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 border-r border-workbench-border bg-workbench-surface flex flex-col h-full select-none shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-workbench-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-workbench-cyan" />
          <span className="font-semibold text-xs text-workbench-heading uppercase tracking-wider">
            Tables ({entities.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding(true)}
            title="Add New Table"
            className="p-1 rounded bg-workbench-elevated hover:bg-workbench-overlay text-workbench-cyan border border-workbench-border transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            title="Collapse Panel"
            className="p-1 rounded hover:bg-workbench-elevated text-workbench-muted hover:text-workbench-text transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add table inline form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-2.5 border-b border-workbench-border bg-workbench-elevated/70">
          <label className="text-[10px] uppercase font-mono text-workbench-muted mb-1 block">New Table Name</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              autoFocus
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="e.g. invoices"
              className="w-full bg-workbench-bg border border-workbench-border-active rounded px-2 py-1 text-xs text-workbench-text font-mono focus:outline-none focus:border-workbench-cyan"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-workbench-cyan text-black font-semibold text-xs hover:bg-cyan-300 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 rounded bg-workbench-bg text-workbench-muted text-xs hover:text-workbench-text"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="p-2 border-b border-workbench-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-workbench-muted absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-8 pr-3 py-1.5 bg-workbench-bg border border-workbench-border rounded text-xs text-workbench-text focus:outline-none focus:border-workbench-cyan font-mono"
          />
        </div>
      </div>

      {/* Entity list */}
      <div className="flex-1 overflow-y-auto py-1 divide-y divide-workbench-border-subtle/30">
        {filteredEntities.length === 0 ? (
          <div className="p-4 text-center text-xs text-workbench-muted font-mono">
            No matching tables found.
          </div>
        ) : (
          filteredEntities.map((entity) => {
            const isSelected = selectedEntityId === entity.id;
            return (
              <div
                key={entity.id}
                onClick={() => onSelectEntity(entity.id)}
                className={cn(
                  'px-3 py-2 flex items-center justify-between cursor-pointer transition-colors font-mono text-xs group',
                  isSelected
                    ? 'bg-workbench-elevated text-workbench-cyan border-l-2 border-l-workbench-cyan font-medium'
                    : 'text-workbench-text hover:bg-workbench-elevated/50 hover:text-workbench-heading'
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {entity.isJunctionTable ? (
                    <Layers className="w-3.5 h-3.5 text-workbench-violet shrink-0" />
                  ) : (
                    <TableIcon className="w-3.5 h-3.5 text-workbench-cyan shrink-0" />
                  )}
                  <span className="truncate" title={entity.name}>
                    {entity.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-workbench-muted shrink-0">
                  <span>{entity.fields.length} col</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div className="p-2 border-t border-workbench-border text-[11px] font-mono text-workbench-muted flex items-center justify-between bg-workbench-bg">
        <span>Total: {entities.length} tables</span>
        <span>
          {entities.reduce((acc, curr) => acc + curr.fields.length, 0)} columns
        </span>
      </div>
    </aside>
  );
};
