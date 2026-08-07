import type { Space } from "@/shared/types";

function samePolygon(a: Space, b: Space): boolean {
  if (a.polygon.length !== b.polygon.length) {
    return false;
  }
  return a.polygon.every(
    (point, index) => point.x === b.polygon[index].x && point.y === b.polygon[index].y,
  );
}

function sameMetadata(a: Space, b: Space): boolean {
  return (
    a.number === b.number &&
    a.name === b.name &&
    a.type === b.type &&
    a.status === b.status &&
    a.rentableArea === b.rentableArea &&
    a.notes === b.notes
  );
}

/**
 * Restores a history snapshot onto the live list.
 *
 * Spaces created or deleted since the snapshot are left untouched: those writes already
 * reached the server, so resurrecting or dropping them locally would desync the two.
 * Returns the ids whose geometry or metadata changed so they can be re-persisted.
 */
export function mergeHistorySnapshot(
  current: Space[],
  snapshot: Space[],
): { spaces: Space[]; changedIds: string[] } {
  const snapshotById = new Map(snapshot.map((space) => [space.id, space]));
  const changedIds: string[] = [];

  const spaces = current.map((space) => {
    const restored = snapshotById.get(space.id);
    if (!restored) {
      return space;
    }

    if (samePolygon(space, restored) && sameMetadata(space, restored)) {
      return space;
    }

    changedIds.push(space.id);
    return {
      ...space,
      number: restored.number,
      name: restored.name,
      type: restored.type,
      status: restored.status,
      rentableArea: restored.rentableArea,
      notes: restored.notes,
      geometricArea: restored.geometricArea,
      polygon: restored.polygon.map((point) => ({ ...point })),
    };
  });

  return { spaces, changedIds };
}
