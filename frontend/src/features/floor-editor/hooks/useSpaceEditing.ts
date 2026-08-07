"use client";

import { useRef } from "react";
import { useSnapping } from "@/features/floor-editor/hooks/useSnapping";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import {
  closestEdgeIndex,
  insertPointOnEdge,
  polygonAreaM2,
  removeVertex,
  translatePolygon,
} from "@/lib/polygon-geometry";
import { screenThresholdToPage } from "@/lib/viewport";
import { toast } from "@/shared/ui/toast";
import type { Point, Space } from "@/shared/types";

const EDGE_HIT_SCREEN_PX = 12;
const MIN_POLYGON_POINTS = 3;

export type SpaceEditingHandlers = {
  onVertexDragMove: (index: number, point: Point) => void;
  onVertexDragEnd: () => void;
  onVertexContextMenu: (index: number) => void;
  onPolygonDragStart: () => void;
  onPolygonDragMove: (delta: Point) => void;
  onPolygonDragEnd: () => void;
  onEdgeDblClick: (point: Point) => void;
};

export function useSpaceEditing(selectedSpace: Space | null): SpaceEditingHandlers {
  const floor = useEditorStore((state) => state.floor);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const viewport = useEditorStore((state) => state.viewport);
  const updateSpaceLocal = useEditorStore((state) => state.updateSpaceLocal);
  const pushHistory = useEditorStore((state) => state.pushHistory);
  const markDirty = useEditorStore((state) => state.markDirty);

  const resolvePoint = useSnapping();
  const dragStarted = useRef(false);

  const applyPolygon = (polygon: Point[]) => {
    if (!selectedSpace) {
      return;
    }
    const geometricArea = polygonAreaM2(
      polygon,
      pageWidth,
      pageHeight,
      floor?.metersPerPixel ?? null,
    );
    updateSpaceLocal({ ...selectedSpace, polygon, geometricArea });
  };

  const commit = () => {
    if (!selectedSpace) {
      return;
    }
    pushHistory();
    markDirty(selectedSpace.id);
  };

  return {
    onVertexDragMove: (index, point) => {
      if (!selectedSpace) {
        return;
      }
      const resolved = resolvePoint(point, selectedSpace.polygon[index]);
      applyPolygon(
        selectedSpace.polygon.map((vertex, i) => (i === index ? resolved : vertex)),
      );
    },

    onVertexDragEnd: commit,

    onVertexContextMenu: (index) => {
      if (!selectedSpace) {
        return;
      }
      if (selectedSpace.polygon.length <= MIN_POLYGON_POINTS) {
        toast("A room needs at least 3 corners", "info");
        return;
      }
      applyPolygon(removeVertex(selectedSpace.polygon, index));
      commit();
    },

    onPolygonDragStart: () => {
      dragStarted.current = true;
    },

    onPolygonDragMove: (delta) => {
      if (!selectedSpace) {
        return;
      }
      applyPolygon(translatePolygon(selectedSpace.polygon, delta));
    },

    onPolygonDragEnd: () => {
      if (!dragStarted.current) {
        return;
      }
      dragStarted.current = false;
      commit();
    },

    onEdgeDblClick: (point) => {
      if (!selectedSpace) {
        return;
      }
      const edgeIndex = closestEdgeIndex(
        point,
        selectedSpace.polygon,
        pageWidth,
        pageHeight,
        screenThresholdToPage(EDGE_HIT_SCREEN_PX, viewport),
      );
      if (edgeIndex === null) {
        return;
      }
      applyPolygon(insertPointOnEdge(selectedSpace.polygon, edgeIndex, point));
      commit();
    },
  };
}
