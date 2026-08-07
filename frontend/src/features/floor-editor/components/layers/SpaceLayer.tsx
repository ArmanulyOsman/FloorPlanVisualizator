"use client";

import { Group, Line, Text } from "react-konva";
import { STATUS_COLORS } from "@/features/floor-editor/constants";
import { normalizedPolygonToFlatPoints } from "@/lib/viewport";
import type { Space, Viewport } from "@/shared/types";

type SpaceLayerProps = {
  spaces: Space[];
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  selectedSpaceId: string | null;
  onSpaceClick: (spaceId: string) => void;
};

export function SpaceLayer({
  spaces,
  pageWidth,
  pageHeight,
  viewport,
  selectedSpaceId,
  onSpaceClick,
}: SpaceLayerProps) {
  return (
    <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
      {spaces.map((space) => {
        const colors = STATUS_COLORS[space.status] ?? STATUS_COLORS.Available;
        const isSelected = space.id === selectedSpaceId;
        const points = normalizedPolygonToFlatPoints(space.polygon, pageWidth, pageHeight);
        const centroid = space.polygon.reduce(
          (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
          { x: 0, y: 0 },
        );
        const labelX = (centroid.x / space.polygon.length) * pageWidth;
        const labelY = (centroid.y / space.polygon.length) * pageHeight;

        return (
          <Group key={space.id}>
            <Line
              points={points}
              closed
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={2 / viewport.scale}
              opacity={isSelected ? 0.55 : 1}
              onClick={() => onSpaceClick(space.id)}
              onTap={() => onSpaceClick(space.id)}
            />
            <Text
              x={labelX - 20}
              y={labelY - 8}
              width={40}
              align="center"
              text={space.number}
              fontSize={14 / viewport.scale}
              fill="#f4f4f5"
              fontStyle="600"
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}
