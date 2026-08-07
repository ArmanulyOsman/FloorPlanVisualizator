import type { Point } from "@/shared/types";

export function normalizePoint(
  pixelX: number,
  pixelY: number,
  pageWidth: number,
  pageHeight: number,
): Point {
  return {
    x: pixelX / pageWidth,
    y: pixelY / pageHeight,
  };
}

export function denormalizePoint(point: Point, pageWidth: number, pageHeight: number): Point {
  return {
    x: point.x * pageWidth,
    y: point.y * pageHeight,
  };
}

export function denormalizePolygon(polygon: Point[], pageWidth: number, pageHeight: number): Point[] {
  return polygon.map((point) => denormalizePoint(point, pageWidth, pageHeight));
}
