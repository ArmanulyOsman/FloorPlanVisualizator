"use client";

import { useCallback, useMemo } from "react";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { denormalizePoint } from "@/lib/coordinates";
import { closeToPoint, snapToVertex } from "@/lib/geometry";
import { clampNormalized, screenThresholdToPage } from "@/lib/viewport";
import type { Point } from "@/shared/types";

const SNAP_SCREEN_PX = 8;

/** Snaps a normalized point onto nearby existing vertices, in screen-constant distance. */
export function useSnapping() {
  const spaces = useEditorStore((state) => state.spaces);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const viewport = useEditorStore((state) => state.viewport);

  const vertices = useMemo(
    () =>
      spaces.flatMap((space) =>
        space.polygon.map((point) => denormalizePoint(point, pageWidth, pageHeight)),
      ),
    [spaces, pageWidth, pageHeight],
  );

  return useCallback(
    (normalized: Point, exclude?: Point): Point => {
      const pagePoint = denormalizePoint(normalized, pageWidth, pageHeight);
      const threshold = screenThresholdToPage(SNAP_SCREEN_PX, viewport);
      const snapped = snapToVertex(pagePoint, vertices, threshold);

      if (!snapped) {
        return clampNormalized(normalized);
      }

      if (exclude) {
        const excludePage = denormalizePoint(exclude, pageWidth, pageHeight);
        if (closeToPoint(snapped, excludePage, threshold / 2)) {
          return clampNormalized(normalized);
        }
      }

      return { x: snapped.x / pageWidth, y: snapped.y / pageHeight };
    },
    [vertices, pageWidth, pageHeight, viewport],
  );
}
