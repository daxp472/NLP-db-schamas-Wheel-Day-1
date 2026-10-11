import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Key, Link as LinkIcon, Table as TableIcon, Layers, Hash } from 'lucide-react';
import { Entity, Field } from '@schema-studio/shared';
import { cn } from '../../utils/cn';

export interface TableNodeData extends Record<string, unknown> {
  entity: Entity;
  isSelected?: boolean;
  onSelectEntity?: (entityId: string) => void;
  onSelectField?: (entityId: string, fieldId: string) => void;
  selectedFieldId?: string | null;
}

export type TableNodeType = Node<TableNodeData, 'tableNode'>;

export const TableNode = memo(({ data, selected }: NodeProps<TableNodeType>) => {
  const entity = data?.entity;
  if (!entity) return null;

  const isNodeSelected = selected || data?.isSelected;

  return (
    <div
      className={cn(
        'w-64 rounded-md border text-xs font-mono shadow-panel transition-all select-none',
        'bg-workbench-surface',
        isNodeSelected
          ? 'border-workbench-cyan ring-1 ring-workbench-cyan/50 shadow-glow-cyan'
          : 'border-workbench-border hover:border-workbench-border-active'
      )}
    >
      {/* Target handle on Left for incoming FK connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="handle-target"
        className="w-2.5 h-2.5 !bg-workbench-muted !border-2 !border-workbench-surface hover:!bg-workbench-cyan transition-colors"
      />

      {/* Table Header */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 border-b rounded-t-md font-sans',
          entity.isJunctionTable
            ? 'bg-workbench-overlay/80 border-workbench-border'
            : 'bg-workbench-elevated border-workbench-border'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {entity.isJunctionTable ? (
            <Layers className="w-3.5 h-3.5 text-workbench-violet shrink-0" />
          ) : (
            <TableIcon className="w-3.5 h-3.5 text-workbench-cyan shrink-0" />
          )}
          <span className="font-semibold text-workbench-heading truncate" title={entity.name}>
            {entity.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {entity.isJunctionTable && (
            <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-workbench-violet/20 text-workbench-violet border border-workbench-violet/40">
              N:M
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-workbench-bg text-workbench-muted border border-workbench-border">
            {entity.fields.length} cols
          </span>
        </div>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-workbench-border-subtle/50 py-0.5 max-h-80 overflow-y-auto">
        {entity.fields.map((field: Field) => {
          const isFieldSelected = data?.selectedFieldId === field.id;

          return (
            <div
              key={field.id}
              onClick={(e) => {
                e.stopPropagation();
                data?.onSelectField?.(entity.id, field.id);
              }}
              className={cn(
                'flex items-center justify-between px-2.5 py-1.5 hover:bg-workbench-elevated/80 cursor-pointer transition-colors group',
                isFieldSelected && 'bg-workbench-elevated text-workbench-cyan font-medium'
              )}
            >
              {/* Field Identifiers & Flags */}
              <div className="flex items-center gap-1.5 overflow-hidden pr-2">
                {field.isPrimaryKey ? (
                  <span title="Primary Key" className="shrink-0 text-amber-400">
                    <Key className="w-3 h-3" />
                  </span>
                ) : field.isForeignKey ? (
                  <span title="Foreign Key" className="shrink-0 text-workbench-violet">
                    <LinkIcon className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="shrink-0 text-workbench-muted/50">
                    <Hash className="w-3 h-3" />
                  </span>
                )}

                <span
                  className={cn(
                    'truncate',
                    field.isPrimaryKey ? 'font-semibold text-workbench-heading' : 'text-workbench-text',
                    field.isNullable && 'text-workbench-muted'
                  )}
                  title={field.name}
                >
                  {field.name}
                </span>

                {field.isUnique && !field.isPrimaryKey && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-workbench-emerald/10 text-workbench-emerald border border-workbench-emerald/30">
                    UQ
                  </span>
                )}
              </div>

              {/* Data Type and Nullability */}
              <div className="flex items-center gap-1 shrink-0 text-[11px]">
                <span className="text-workbench-muted group-hover:text-workbench-cyan transition-colors">
                  {field.dataType}
                </span>
                {field.isNullable && (
                  <span className="text-[9px] text-workbench-muted/60" title="Nullable">
                    ?
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Source handle on Right for outgoing FK references */}
      <Handle
        type="source"
        position={Position.Right}
        id="handle-source"
        className="w-2.5 h-2.5 !bg-workbench-cyan !border-2 !border-workbench-surface hover:!bg-white transition-colors"
      />
    </div>
  );
});

TableNode.displayName = 'TableNode';
