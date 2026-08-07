"use client";

import { Group, Line, Circle } from "react-konva";
import { DRAWING_COLOR } from "@/features/floor-editor/constants";
import { denormalizePoint } from "@/lib/coordinates";
import { normalizedPolygonToFlatPoints } from "@/lib/viewport";
import type { Point, Viewport } from "@/shared/types";

type DrawingLayerProps = {
  draftPolygon: Point[];
  draftCursor: Point | null;
  calibratePoints: Point[];
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  mode: string;
};

export function DrawingLayer({
  draftPolygon,
  draftCursor,
  calibratePoints,
  pageWidth,
  pageHeight,
  viewport,
  mode,
}: DrawingLayerProps) {
  const draftPoints =
    draftPolygon.length > 0
      ? normalizedPolygonToFlatPoints(draftPolygon, pageWidth, pageHeight)
      : [];

  const previewPoints =
    draftCursor && draftPolygon.length > 0
      ? [
          ...draftPoints,
          denormalizePoint(draftCursor, pageWidth, pageHeight).x,
          denormalizePoint(draftCursor, pageWidth, pageHeight).y,
        ]
      : draftPoints;

  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      {mode === "draw" && draftPolygon.length > 0 && (
        <Line
          points={previewPoints}
          stroke={DRAWING_COLOR.stroke}
          strokeWidth={2 / viewport.scale}
          dash={draftCursor ? undefined : [6 / viewport.scale, 4 / viewport.scale]}
        />
      )}

      {mode === "draw" &&
        draftPolygon.map((point, index) => {
          const page = denormalizePoint(point, pageWidth, pageHeight);
          return (
            <Circle
              key={`draft-${index}`}
              x={page.x}
              y={page.y}
              radius={5 / viewport.scale}
              fill={index === 0 ? "#fbbf24" : DRAWING_COLOR.stroke}
            />
          );
        })}

      {mode === "draw" && draftCursor && (
        <Circle
          x={denormalizePoint(draftCursor, pageWidth, pageHeight).x}
          y={denormalizePoint(draftCursor, pageWidth, pageHeight).y}
          radius={4 / viewport.scale}
          stroke="#60a5fa"
          strokeWidth={1.5 / viewport.scale}
        />
      )}

      {mode === "calibrate" &&
        calibratePoints.map((point, index) => {
          const page = denormalizePoint(point, pageWidth, pageHeight);
          return (
            <Circle
              key={`cal-${index}`}
              x={page.x}
              y={page.y}
              radius={6 / viewport.scale}
              fill={index === 0 ? "#fbbf24" : "#a855f7"}
            />
          );
        })}

      {mode === "calibrate" && calibratePoints.length === 2 && (
        <Line
          points={normalizedPolygonToFlatPoints(calibratePoints, pageWidth, pageHeight)}
          stroke="#a855f7"
          strokeWidth={2 / viewport.scale}
          dash={[8 / viewport.scale, 4 / viewport.scale]}
        />
      )}
    </Group>
  );
}
