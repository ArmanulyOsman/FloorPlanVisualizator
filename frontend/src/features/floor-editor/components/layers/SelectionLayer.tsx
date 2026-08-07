"use client";

import { useRef } from "react";
import type Konva from "konva";
import { Circle, Group, Line } from "react-konva";
import { SELECTED_COLOR } from "@/features/floor-editor/constants";
import { denormalizePoint } from "@/lib/coordinates";
import { normalizedPolygonToFlatPoints } from "@/lib/viewport";
import type { EditorMode, Point, Space, Viewport } from "@/shared/types";

type SelectionLayerProps = {
  space: Space | null;
  mode: EditorMode;
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  onVertexDragMove: (index: number, point: Point) => void;
  onVertexDragEnd: () => void;
  onVertexContextMenu: (index: number) => void;
  onPolygonDragStart: () => void;
  onPolygonDragMove: (delta: Point) => void;
  onPolygonDragEnd: () => void;
  onEdgeDblClick: (point: Point) => void;
};

export function SelectionLayer({
  space,
  mode,
  pageWidth,
  pageHeight,
  viewport,
  onVertexDragMove,
  onVertexDragEnd,
  onVertexContextMenu,
  onPolygonDragStart,
  onPolygonDragMove,
  onPolygonDragEnd,
  onEdgeDblClick,
}: SelectionLayerProps) {
  const lastDrag = useRef({ x: 0, y: 0 });

  if (!space) {
    return null;
  }

  const isEditing = mode === "edit";
  const points = normalizedPolygonToFlatPoints(space.polygon, pageWidth, pageHeight);

  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      <Line
        points={points}
        closed
        fill={SELECTED_COLOR.fill}
        stroke={SELECTED_COLOR.stroke}
        strokeWidth={2.5 / viewport.scale}
        dash={isEditing ? [8 / viewport.scale, 4 / viewport.scale] : undefined}
        // Outside the edit tool the stage keeps the pointer so panning stays available.
        listening={isEditing}
        draggable={isEditing}
        onMouseEnter={(event) => {
          const container = event.target.getStage()?.container();
          if (container) {
            container.style.cursor = "move";
          }
        }}
        onMouseLeave={(event) => {
          const container = event.target.getStage()?.container();
          if (container) {
            container.style.cursor = "";
          }
        }}
        onDragStart={() => {
          lastDrag.current = { x: 0, y: 0 };
          onPolygonDragStart();
        }}
        onDragMove={(event) => {
          // Konva derives the node offset from where the drag began, so it grows cumulatively.
          // The polygon points carry the movement instead, so subtract the part already applied
          // and park the node back at the origin to avoid drawing the shift twice.
          const node = event.target;
          const delta = {
            x: (node.x() - lastDrag.current.x) / pageWidth,
            y: (node.y() - lastDrag.current.y) / pageHeight,
          };
          lastDrag.current = { x: node.x(), y: node.y() };
          node.position({ x: 0, y: 0 });
          onPolygonDragMove(delta);
        }}
        onDragEnd={onPolygonDragEnd}
        onDblClick={(event) => {
          const pointer = event.target.getStage()?.getPointerPosition();
          if (!pointer) {
            return;
          }
          const pageX = (pointer.x - viewport.x) / viewport.scale;
          const pageY = (pointer.y - viewport.y) / viewport.scale;
          onEdgeDblClick({ x: pageX / pageWidth, y: pageY / pageHeight });
        }}
      />

      {isEditing &&
        space.polygon.map((vertex, index) => {
          const page = denormalizePoint(vertex, pageWidth, pageHeight);

          return (
            <Circle
              key={`${space.id}-handle-${index}`}
              x={page.x}
              y={page.y}
              radius={5.5 / viewport.scale}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={2 / viewport.scale}
              hitStrokeWidth={12 / viewport.scale}
              draggable
              onMouseEnter={(event) => {
                const container = event.target.getStage()?.container();
                if (container) {
                  container.style.cursor = "grab";
                }
              }}
              onMouseLeave={(event) => {
                const container = event.target.getStage()?.container();
                if (container) {
                  container.style.cursor = "";
                }
              }}
              onDragMove={(event: Konva.KonvaEventObject<DragEvent>) => {
                const node = event.target;
                onVertexDragMove(index, { x: node.x() / pageWidth, y: node.y() / pageHeight });
              }}
              onDragEnd={onVertexDragEnd}
              onContextMenu={(event) => {
                event.evt.preventDefault();
                onVertexContextMenu(index);
              }}
            />
          );
        })}
    </Group>
  );
}
