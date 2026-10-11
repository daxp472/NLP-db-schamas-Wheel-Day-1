import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  Edge,
  getSmoothStepPath,
} from '@xyflow/react';
import { cn } from '../../utils/cn';

export interface RelationshipEdgeData extends Record<string, unknown> {
  cardinality?: '1:1' | '1:N' | 'N:M';
  sourceFieldName?: string;
  targetFieldName?: string;
  onDelete?: string;
}

export type RelationshipEdgeType = Edge<RelationshipEdgeData, 'relationshipEdge'>;

export const RelationshipEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<RelationshipEdgeType>) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const cardinality = data?.cardinality || '1:N';
  const onDeleteText = data?.onDelete;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? '#00D2FF' : '#4B5574',
          strokeWidth: selected ? 2.5 : 1.75,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            'px-2 py-0.5 rounded text-[10px] font-mono tracking-tight font-semibold border shadow-sm transition-all',
            'bg-workbench-elevated text-workbench-text border-workbench-border',
            selected && 'bg-workbench-overlay text-workbench-cyan border-workbench-cyan shadow-glow-cyan'
          )}
          title={`Cardinality: ${cardinality}${onDeleteText ? ` | ON DELETE ${onDeleteText}` : ''}`}
        >
          {cardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

RelationshipEdge.displayName = 'RelationshipEdge';
