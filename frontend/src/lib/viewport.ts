import type { Point, Space, Viewport } from "@/shared/types";

export const VIEWPORT_PADDING = 4;

export type FitMode = "width" | "page";

export function computeFitViewport(
  containerWidth: number,
  containerHeight: number,
  pageWidth: number,
  pageHeight: number,
  mode: FitMode = "width",
  padding = VIEWPORT_PADDING,
): Viewport {
  const safePageWidth = Math.max(pageWidth, 1);
  const safePageHeight = Math.max(pageHeight, 1);
  const availableWidth = Math.max(containerWidth - padding * 2, 1);
  const availableHeight = Math.max(containerHeight - padding * 2, 1);

  // Fit width: stretch plan to container width (best for drawing).
  // Fit page: keep whole page visible.
  const scale =
    mode === "width"
      ? availableWidth / safePageWidth
      : Math.min(availableWidth / safePageWidth, availableHeight / safePageHeight);

  const clampedScale = Math.min(Math.max(scale, 0.05), 20);
  const contentWidth = safePageWidth * clampedScale;
  const contentHeight = safePageHeight * clampedScale;

  return {
    scale: clampedScale,
    x: (containerWidth - contentWidth) / 2,
    y: Math.max((containerHeight - contentHeight) / 2, padding),
  };
}

export function cloneSpaces(spaces: Space[]): Space[] {
  return spaces.map((space) => ({
    ...space,
    polygon: space.polygon.map((point) => ({ ...point })),
  }));
}

export function screenToPage(
  screenX: number,
  screenY: number,
  viewport: Viewport,
): Point {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

export function pageToNormalized(point: Point, pageWidth: number, pageHeight: number): Point {
  return {
    x: point.x / pageWidth,
    y: point.y / pageHeight,
  };
}

export function normalizedToPage(point: Point, pageWidth: number, pageHeight: number): Point {
  return {
    x: point.x * pageWidth,
    y: point.y * pageHeight,
  };
}

export function screenToNormalized(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  pageWidth: number,
  pageHeight: number,
): Point {
  const page = screenToPage(screenX, screenY, viewport);
  return pageToNormalized(page, pageWidth, pageHeight);
}

export function normalizedToScreen(
  point: Point,
  viewport: Viewport,
  pageWidth: number,
  pageHeight: number,
): Point {
  const page = normalizedToPage(point, pageWidth, pageHeight);
  return {
    x: page.x * viewport.scale + viewport.x,
    y: page.y * viewport.scale + viewport.y,
  };
}

export function normalizedPolygonToFlatPoints(
  polygon: Point[],
  pageWidth: number,
  pageHeight: number,
): number[] {
  return polygon.flatMap((point) => {
    const page = normalizedToPage(point, pageWidth, pageHeight);
    return [page.x, page.y];
  });
}

export function screenThresholdToPage(thresholdPx: number, viewport: Viewport): number {
  return thresholdPx / viewport.scale;
}

export function clampNormalized(point: Point): Point {
  return {
    x: Math.min(Math.max(point.x, 0), 1),
    y: Math.min(Math.max(point.y, 0), 1),
  };
}
