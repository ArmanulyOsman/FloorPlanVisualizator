import type { Point } from "@/shared/types";

const EPSILON = 1e-9;

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function distanceBetween(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function snapToVertex(
  cursor: Point,
  vertices: Point[],
  threshold: number,
): Point | null {
  let closest: Point | null = null;
  let closestDistance = threshold;

  for (const vertex of vertices) {
    const distance = distanceBetween(cursor, vertex);
    if (distance <= closestDistance) {
      closest = vertex;
      closestDistance = distance;
    }
  }

  return closest;
}

export function closeToPoint(a: Point, b: Point, threshold: number): boolean {
  return distanceBetween(a, b) <= threshold;
}
