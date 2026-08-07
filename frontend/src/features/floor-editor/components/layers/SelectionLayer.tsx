"use client";

import type Konva from "konva";
import { Group, Line, Circle } from "react-konva";
import { SELECTED_COLOR } from "@/features/floor-editor/constants";
import { denormalizePoint } from "@/lib/coordinates";
import { normalizedPolygonToFlatPoints } from "@/lib/viewport";
import type { Point, Space, Viewport } from "@/shared/types";

type SelectionLayerProps = {
  space: Space | null;
  mode: string;
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
  if (!space) {
    return null;
  }

  const points = normalizedPolygonToFlatPoints(space.polygon, pageWidth, pageHeight);
  const handleRadius = 6 / viewport.scale;
  const lastDrag = { x: 0, y: 0 };

  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      <Line
        points={points}
        closed
        fill={SELECTED_COLOR.fill}
        stroke={SELECTED_COLOR.stroke}
        strokeWidth={2.5 / viewport.scale}
        draggable={mode === "edit"}
        onDragStart={(event) => {
          if (mode !== "edit") {
            return;
          }
          event.cancelBubble = true;
          lastDrag.x = 0;
          lastDrag.y = 0;
          onPolygonDragStart();
        }}
        onDragMove={(event) => {
          if (mode !== "edit") {
            return;
          }
          const node = event.target;
          const dx = (node.x() - lastDrag.x) / pageWidth;
          const dy = (node.y() - lastDrag.y) / pageHeight;
          lastDrag.x = node.x();
          lastDrag.y = node.y();
          node.position({ x: 0, y: 0 });
          onPolygonDragMove({ x: dx, y: dy });
        }}
        onDragEnd={() => {
          if (mode !== "edit") {
            return;
          }
          onPolygonDragEnd();
        }}
        onDblClick={(event) => {
          if (mode !== "edit") {
            return;
          }
          const stage = event.target.getStage();
          const pointer = stage?.getPointerPosition();
          if (!pointer) {
            return;
          }
          const pageX = (pointer.x - viewport.x) / viewport.scale;
          const pageY = (pointer.y - viewport.y) / viewport.scale;
          onEdgeDblClick({ x: pageX / pageWidth, y: pageY / pageHeight });
        }}
      />

      {mode === "edit" &&
        space.polygon.map((vertex, index) => {
          const page = denormalizePoint(vertex, pageWidth, pageHeight);

          return (
            <Circle
              key={`${space.id}-handle-${index}`}
              x={page.x}
              y={page.y}
              radius={handleRadius}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={2 / viewport.scale}
              draggable
              onDragMove={(event: Konva.KonvaEventObject<DragEvent>) => {
                const node = event.target;
                onVertexDragMove(index, {
                  x: node.x() / pageWidth,
                  y: node.y() / pageHeight,
                });
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
