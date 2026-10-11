import { Entity, Relationship } from '@schema-studio/shared';

export interface LayoutedPosition {
  x: number;
  y: number;
}

/**
 * Computes non-overlapping positions for ER Diagram nodes using topological rank layout
 */
export function calculateAutoLayout(
  entities: Entity[],
  relationships: Relationship[]
): Record<string, LayoutedPosition> {
  const positions: Record<string, LayoutedPosition> = {};
  if (entities.length === 0) return positions;

  const nodeWidth = 280;
  const nodeHeight = 320;
  const gapX = 140;
  const gapY = 80;

  // Compute depth/rank for each entity
  const inDegree = new Map<string, number>();
  const entityMap = new Map<string, Entity>(entities.map((e) => [e.id, e]));

  entities.forEach((e) => inDegree.set(e.id, 0));

  relationships.forEach((rel) => {
    // Child (rel.sourceEntityId) references Parent (rel.targetEntityId)
    // Parent should be placed to the left (rank 0), child to the right
    if (rel.sourceEntityId !== rel.targetEntityId && entityMap.has(rel.sourceEntityId)) {
      const cur = inDegree.get(rel.sourceEntityId) || 0;
      inDegree.set(rel.sourceEntityId, cur + 1);
    }
  });

  // Group entities by rank
  const ranks: Map<number, Entity[]> = new Map();

  entities.forEach((entity) => {
    const deg = inDegree.get(entity.id) || 0;
    const rank = Math.min(deg, 4); // Cap max columns to 5
    if (!ranks.has(rank)) ranks.set(rank, []);
    ranks.get(rank)!.push(entity);
  });

  const sortedRanks = Array.from(ranks.keys()).sort((a, b) => a - b);

  sortedRanks.forEach((rank, colIndex) => {
    const columnEntities = ranks.get(rank)!;
    columnEntities.forEach((entity, rowIndex) => {
      positions[entity.id] = {
        x: 60 + colIndex * (nodeWidth + gapX),
        y: 60 + rowIndex * (nodeHeight + gapY),
      };
    });
  });

  return positions;
}
