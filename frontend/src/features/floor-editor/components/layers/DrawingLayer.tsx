"use client";

import { Circle, Group, Line } from "react-konva";
import { DRAWING_COLOR } from "@/features/floor-editor/constants";
import { denormalizePoint } from "@/lib/coordinates";
import { normalizedPolygonToFlatPoints } from "@/lib/viewport";
import type { EditorMode, Point, Viewport } from "@/shared/types";

type DrawingLayerProps = {
  draftPolygon: Point[];
  draftCursor: Point | null;
  calibratePoints: Point[];
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  mode: EditorMode;
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
  const px = (value: number) => value / viewport.scale;
  const toPage = (point: Point) => denormalizePoint(point, pageWidth, pageHeight);

  const draftPoints = normalizedPolygonToFlatPoints(draftPolygon, pageWidth, pageHeight);
  const cursorPage = draftCursor ? toPage(draftCursor) : null;
  const canClose = draftPolygon.length >= 3;

  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      {mode === "draw" && draftPolygon.length > 0 && (
        <>
          {canClose && (
            <Line
              points={draftPoints}
              closed
              fill={DRAWING_COLOR.fill}
              stroke="transparent"
              listening={false}
            />
          )}
          <Line points={draftPoints} stroke={DRAWING_COLOR.stroke} strokeWidth={px(2)} />
          {cursorPage && (
            <Line
              points={[
                draftPoints[draftPoints.length - 2],
                draftPoints[draftPoints.length - 1],
                cursorPage.x,
                cursorPage.y,
              ]}
              stroke={DRAWING_COLOR.stroke}
              strokeWidth={px(1.5)}
              dash={[px(6), px(4)]}
            />
          )}
          {canClose && cursorPage && (
            <Line
              points={[cursorPage.x, cursorPage.y, draftPoints[0], draftPoints[1]]}
              stroke={DRAWING_COLOR.stroke}
              strokeWidth={px(1)}
              opacity={0.4}
              dash={[px(4), px(4)]}
            />
          )}
        </>
      )}

      {mode === "draw" &&
        draftPolygon.map((point, index) => {
          const page = toPage(point);
          const isFirst = index === 0;
          return (
            <Circle
              key={`draft-${index}`}
              x={page.x}
              y={page.y}
              radius={px(isFirst && canClose ? 6 : 4)}
              fill={isFirst ? "#fbbf24" : "#ffffff"}
              stroke={DRAWING_COLOR.stroke}
              strokeWidth={px(1.5)}
            />
          );
        })}

      {mode === "draw" && cursorPage && (
        <Circle
          x={cursorPage.x}
          y={cursorPage.y}
          radius={px(4)}
          stroke="#60a5fa"
          strokeWidth={px(1.5)}
        />
      )}

      {mode === "calibrate" && (
        <>
          {calibratePoints.length === 1 && cursorPage && (
            <Line
              points={[
                toPage(calibratePoints[0]).x,
                toPage(calibratePoints[0]).y,
                cursorPage.x,
                cursorPage.y,
              ]}
              stroke="#a855f7"
              strokeWidth={px(1.5)}
              dash={[px(6), px(4)]}
            />
          )}
          {calibratePoints.length === 2 && (
            <Line
              points={normalizedPolygonToFlatPoints(calibratePoints, pageWidth, pageHeight)}
              stroke="#a855f7"
              strokeWidth={px(2)}
            />
          )}
          {calibratePoints.map((point, index) => {
            const page = toPage(point);
            return (
              <Circle
                key={`cal-${index}`}
                x={page.x}
                y={page.y}
                radius={px(5)}
                fill="#a855f7"
                stroke="#ffffff"
                strokeWidth={px(1.5)}
              />
            );
          })}
        </>
      )}
    </Group>
  );
}
