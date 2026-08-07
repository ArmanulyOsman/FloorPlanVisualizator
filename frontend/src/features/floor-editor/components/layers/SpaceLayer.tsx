"use client";

import { Group, Line, Text } from "react-konva";
import { STATUS_COLORS } from "@/features/floor-editor/constants";
import { normalizedPolygonToFlatPoints, polygonBounds } from "@/lib/viewport";
import type { Space, Viewport } from "@/shared/types";

type SpaceLayerProps = {
  spaces: Space[];
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  selectedSpaceId: string | null;
  hoveredSpaceId: string | null;
};

const MIN_LABEL_SCREEN_PX = 34;

export function SpaceLayer({
  spaces,
  pageWidth,
  pageHeight,
  viewport,
  selectedSpaceId,
  hoveredSpaceId,
}: SpaceLayerProps) {
  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      {spaces.map((space) => {
        const colors = STATUS_COLORS[space.status] ?? STATUS_COLORS.Available;
        const isSelected = space.id === selectedSpaceId;
        const isHovered = space.id === hoveredSpaceId;
        const points = normalizedPolygonToFlatPoints(space.polygon, pageWidth, pageHeight);
        const bounds = polygonBounds(space.polygon);

        if (!bounds) {
          return null;
        }

        const width = (bounds.maxX - bounds.minX) * pageWidth;
        const height = (bounds.maxY - bounds.minY) * pageHeight;
        const centerX = ((bounds.minX + bounds.maxX) / 2) * pageWidth;
        const centerY = ((bounds.minY + bounds.maxY) / 2) * pageHeight;
        const fitsLabel =
          width * viewport.scale > MIN_LABEL_SCREEN_PX &&
          height * viewport.scale > MIN_LABEL_SCREEN_PX;

        return (
          <Group key={space.id}>
            <Line
              points={points}
              closed
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={(isHovered ? 3 : 1.5) / viewport.scale}
              opacity={isSelected ? 0.35 : isHovered ? 1 : 0.9}
            />
            {fitsLabel && (
              <Text
                x={centerX - 60 / viewport.scale}
                y={centerY - 8 / viewport.scale}
                width={120 / viewport.scale}
                align="center"
                text={space.number}
                fontSize={13 / viewport.scale}
                fontStyle="600"
                fill="#ffffff"
                shadowColor="#000000"
                shadowBlur={4 / viewport.scale}
                shadowOpacity={0.8}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
