import type { Point } from "@/shared/types";

const EPSILON = 1e-9;

export function hasMinimumPoints(polygon: Point[], min = 3): boolean {
  return polygon.length >= min;
}

export function isWithinPage(polygon: Point[]): boolean {
  return polygon.every(
    (point) => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1,
  );
}

export function hasSelfIntersection(polygon: Point[]): boolean {
  const size = polygon.length;
  if (size < 3) {
    return false;
  }

  for (let i = 0; i < size; i++) {
    const a1 = polygon[i];
    const a2 = polygon[(i + 1) % size];

    for (let j = i + 1; j < size; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === size - 1)) {
        continue;
      }

      const b1 = polygon[j];
      const b2 = polygon[(j + 1) % size];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }

  return false;
}

function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);

  if (((d1 > EPSILON && d2 < -EPSILON) || (d1 < -EPSILON && d2 > EPSILON))
    && ((d3 > EPSILON && d4 < -EPSILON) || (d3 < -EPSILON && d4 > EPSILON))) {
    return true;
  }

  return false;
}

function direction(a: Point, b: Point, c: Point): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

export function validatePolygon(polygon: Point[]): string | null {
  if (!hasMinimumPoints(polygon)) {
    return "Polygon must contain at least 3 points";
  }
  if (!isWithinPage(polygon)) {
    return "All points must be inside the page";
  }
  if (hasSelfIntersection(polygon)) {
    return "Polygon must not self-intersect";
  }
  return null;
}
