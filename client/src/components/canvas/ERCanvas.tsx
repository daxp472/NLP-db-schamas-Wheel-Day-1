import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CanonicalSchema } from '@schema-studio/shared';
import { TableNode } from './TableNode';
import { RelationshipEdge } from './RelationshipEdge';

interface ERCanvasProps {
  schema: CanonicalSchema;
  selectedEntityId: string | null;
  selectedFieldId: string | null;
  onSelectEntity: (entityId: string) => void;
  onSelectField: (entityId: string, fieldId: string) => void;
  onUpdatePositions: (positions: Record<string, { x: number; y: number }>) => void;
  onConnectRelationship?: (sourceEntityId: string, sourceFieldId: string, targetEntityId: string, targetFieldId: string) => void;
}

const nodeTypes: NodeTypes = {
  tableNode: TableNode as any,
};

const edgeTypes: EdgeTypes = {
  relationshipEdge: RelationshipEdge as any,
};

export const ERCanvas: React.FC<ERCanvasProps> = ({
  schema,
  selectedEntityId,
  selectedFieldId,
  onSelectEntity,
  onSelectField,
  onUpdatePositions,
}) => {
  // Map schema entities to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return schema.entities.map((entity, index) => {
      const savedPos = schema.layout?.positions?.[entity.id];
      const defaultPos = {
        x: 80 + (index % 3) * 320,
        y: 80 + Math.floor(index / 3) * 360,
      };

      return {
        id: entity.id,
        type: 'tableNode',
        position: savedPos || defaultPos,
        data: {
          entity,
          isSelected: selectedEntityId === entity.id,
          selectedFieldId,
          onSelectEntity,
          onSelectField,
        },
      };
    });
  }, [schema.entities, schema.layout?.positions, selectedEntityId, selectedFieldId, onSelectEntity, onSelectField]);

  // Map schema relationships to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return schema.relationships.map((rel) => {
      const isSelected =
        selectedEntityId === rel.sourceEntityId || selectedEntityId === rel.targetEntityId;

      const sourceEntity = schema.entities.find((e) => e.id === rel.sourceEntityId);
      const targetEntity = schema.entities.find((e) => e.id === rel.targetEntityId);
      const sourceField = sourceEntity?.fields.find((f) => f.id === rel.sourceFieldId);
      const targetField = targetEntity?.fields.find((f) => f.id === rel.targetFieldId);

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        sourceHandle: 'handle-source',
        targetHandle: 'handle-target',
        type: 'relationshipEdge',
        animated: false,
        selected: isSelected,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isSelected ? '#00D2FF' : '#4B5574',
        },
        data: {
          cardinality: rel.cardinality,
          sourceFieldName: sourceField?.name,
          targetFieldName: targetField?.name,
          onDelete: rel.onDelete,
        },
      };
    });
  }, [schema.relationships, schema.entities, selectedEntityId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever schema changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Debounced position update on drag stop
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      const newPositions: Record<string, { x: number; y: number }> = {
        ...(schema.layout?.positions || {}),
        [node.id]: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      };
      onUpdatePositions(newPositions);
    },
    [schema.layout?.positions, onUpdatePositions]
  );

  return (
    <div className="w-full h-full bg-workbench-bg relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => onSelectEntity(node.id)}
        onPaneClick={() => onSelectEntity('')}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1F2437"
        />
        <Controls className="!bg-workbench-elevated !border-workbench-border !text-workbench-text" />
        <MiniMap
          nodeColor={(n) => (n.id === selectedEntityId ? '#00D2FF' : '#23283B')}
          maskColor="rgba(11, 13, 19, 0.7)"
          className="!bottom-4 !right-4 !bg-workbench-surface !border !border-workbench-border !rounded"
        />
      </ReactFlow>
    </div>
  );
};
