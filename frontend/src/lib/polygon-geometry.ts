import type { Point } from "@/shared/types";
import { denormalizePolygon } from "@/lib/coordinates";

export function polygonAreaM2(
  polygon: Point[],
  pageWidth: number,
  pageHeight: number,
  metersPerPixel: number | null,
): number | null {
  if (!metersPerPixel || polygon.length < 3) {
    return null;
  }

  const points = denormalizePolygon(polygon, pageWidth, pageHeight);
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }

  return Math.abs(area / 2) * metersPerPixel * metersPerPixel;
}

export function closestEdgeIndex(
  point: Point,
  polygon: Point[],
  pageWidth: number,
  pageHeight: number,
  thresholdPage: number,
): number | null {
  if (polygon.length < 2) {
    return null;
  }

  const pagePoint = { x: point.x * pageWidth, y: point.y * pageHeight };
  let bestIndex: number | null = null;
  let bestDistance = thresholdPage;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const ax = a.x * pageWidth;
    const ay = a.y * pageHeight;
    const bx = b.x * pageWidth;
    const by = b.y * pageHeight;

    const distance = pointToSegmentDistance(pagePoint.x, pagePoint.y, ax, ay, bx, by);
    if (distance <= bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0), 1);
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export function insertPointOnEdge(polygon: Point[], edgeIndex: number, point: Point): Point[] {
  const next = [...polygon];
  next.splice(edgeIndex + 1, 0, { ...point });
  return next;
}

export function translatePolygon(polygon: Point[], delta: Point): Point[] {
  return polygon.map((point) => ({
    x: Math.min(Math.max(point.x + delta.x, 0), 1),
    y: Math.min(Math.max(point.y + delta.y, 0), 1),
  }));
}

export function removeVertex(polygon: Point[], index: number): Point[] {
  return polygon.filter((_, i) => i !== index);
}
