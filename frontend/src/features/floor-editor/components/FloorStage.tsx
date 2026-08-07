"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import { DrawingLayer } from "@/features/floor-editor/components/layers/DrawingLayer";
import { SelectionLayer } from "@/features/floor-editor/components/layers/SelectionLayer";
import { SpaceLayer } from "@/features/floor-editor/components/layers/SpaceLayer";
import { useFloorPreview } from "@/features/floor-editor/hooks/useFloorPreview";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { denormalizePoint } from "@/lib/coordinates";
import { closeToPoint, isPointInPolygon, snapToVertex } from "@/lib/geometry";
import {
  closestEdgeIndex,
  insertPointOnEdge,
  polygonAreaM2,
  removeVertex,
  translatePolygon,
} from "@/lib/polygon-geometry";
import { validatePolygon } from "@/lib/polygon-validation";
import { screenThresholdToPage, screenToNormalized, computeFitViewport } from "@/lib/viewport";
import { updateFloor } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { Point } from "@/shared/types";

type FloorStageProps = {
  onReadyFit: (fit: (mode?: "width" | "page") => void) => void;
};

const SNAP_SCREEN_PX = 8;
const CLOSE_SCREEN_PX = 10;

export function FloorStage({ onReadyFit }: FloorStageProps) {
  const floor = useEditorStore((state) => state.floor);
  const spaces = useEditorStore((state) => state.spaces);
  const mode = useEditorStore((state) => state.mode);
  const viewport = useEditorStore((state) => state.viewport);
  const draftPolygon = useEditorStore((state) => state.draftPolygon);
  const draftCursor = useEditorStore((state) => state.draftCursor);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const calibratePoints = useEditorStore((state) => state.calibratePoints);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);

  const setViewport = useEditorStore((state) => state.setViewport);
  const panBy = useEditorStore((state) => state.panBy);
  const zoomAt = useEditorStore((state) => state.zoomAt);
  const addDraftPoint = useEditorStore((state) => state.addDraftPoint);
  const setDraftCursor = useEditorStore((state) => state.setDraftCursor);
  const selectSpace = useEditorStore((state) => state.selectSpace);
  const setMode = useEditorStore((state) => state.setMode);
  const finishDraft = useEditorStore((state) => state.finishDraft);
  const addCalibratePoint = useEditorStore((state) => state.addCalibratePoint);
  const clearCalibrate = useEditorStore((state) => state.clearCalibrate);
  const setError = useEditorStore((state) => state.setError);
  const setFloor = useEditorStore((state) => state.setFloor);
  const updateSpaceLocal = useEditorStore((state) => state.updateSpaceLocal);
  const pushHistory = useEditorStore((state) => state.pushHistory);
  const markDirty = useEditorStore((state) => state.markDirty);

  const { imageUrl, loading, error: previewError, ready, onImageLoad, onImageError } =
    useFloorPreview(floor);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const polygonDragStarted = useRef(false);
  const [calibrateDistance, setCalibrateDistance] = useState("10");

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;

  const measure = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) {
      return;
    }
    const width = Math.max(Math.floor(element.clientWidth), 0);
    const height = Math.max(Math.floor(element.clientHeight), 0);
    setStageSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const fitViewport = useCallback(
    (fitMode: "width" | "page" = "width") => {
      const element = wrapperRef.current;
      const width = element?.clientWidth ?? stageSize.width;
      const height = element?.clientHeight ?? stageSize.height;

      if (!floor || pageWidth <= 1 || pageHeight <= 1 || width < 32 || height < 32) {
        return;
      }

      setViewport(computeFitViewport(width, height, pageWidth, pageHeight, fitMode, 4));
    },
    [floor, pageWidth, pageHeight, stageSize.width, stageSize.height, setViewport],
  );

  useLayoutEffect(() => {
    measure();
    const element = wrapperRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, floor?.id]);

  useEffect(() => {
    onReadyFit(fitViewport);
  }, [fitViewport, onReadyFit]);

  useEffect(() => {
    if (ready && pageWidth > 1 && pageHeight > 1 && stageSize.width >= 32 && stageSize.height >= 32) {
      fitViewport("width");
    }
  }, [ready, floor?.id, pageWidth, pageHeight, stageSize.width, stageSize.height, fitViewport]);

  if (!floor) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-200">
        Waiting for floor data...
      </div>
    );
  }

  const getNormalizedFromStage = (stage: Konva.Stage): Point | null => {
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return null;
    }
    return screenToNormalized(pointer.x, pointer.y, viewport, pageWidth, pageHeight);
  };

  const allVerticesPage = spaces.flatMap((space) =>
    space.polygon.map((point) => denormalizePoint(point, pageWidth, pageHeight)),
  );

  const resolvePoint = (normalized: Point, exclude?: Point): Point => {
    const pagePoint = denormalizePoint(normalized, pageWidth, pageHeight);
    const threshold = screenThresholdToPage(SNAP_SCREEN_PX, viewport);
    const snapped = snapToVertex(pagePoint, allVerticesPage, threshold);

    if (snapped && exclude) {
      const excludePage = denormalizePoint(exclude, pageWidth, pageHeight);
      if (closeToPoint(snapped, excludePage, threshold / 2)) {
        return normalized;
      }
    }

    return snapped
      ? { x: snapped.x / pageWidth, y: snapped.y / pageHeight }
      : {
          x: Math.min(Math.max(normalized.x, 0), 1),
          y: Math.min(Math.max(normalized.y, 0), 1),
        };
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) {
      return;
    }
    zoomAt(pointer.x, pointer.y, event.evt.deltaY > 0 ? 0.9 : 1.1);
  };

  const handleStageMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    // Pan when clicking empty stage background
    const clickedStage = event.target === stage;
    const isMiddle = event.evt.button === 1;
    const isAltPan = event.evt.button === 0 && event.evt.altKey;
    const isViewPan = mode === "view" && event.evt.button === 0;

    if (isMiddle || isAltPan || (isViewPan && clickedStage)) {
      isPanning.current = true;
      lastPointer.current = stage.getPointerPosition() ?? { x: 0, y: 0 };
      if (!clickedStage) {
        return;
      }
    }

    if (!clickedStage && mode !== "draw" && mode !== "calibrate") {
      return;
    }

    const normalized = getNormalizedFromStage(stage);
    if (!normalized) {
      return;
    }

    if (mode === "view" || mode === "select") {
      const hit = [...spaces].reverse().find((space) => isPointInPolygon(normalized, space.polygon));
      if (hit) {
        selectSpace(hit.id);
        setMode("select");
      } else if (clickedStage) {
        selectSpace(null);
      }
      return;
    }

    if (mode === "calibrate") {
      addCalibratePoint(normalized);
      return;
    }

    if (mode === "draw") {
      if (draftPolygon.length >= 3) {
        const firstPage = denormalizePoint(draftPolygon[0], pageWidth, pageHeight);
        const clickPage = denormalizePoint(normalized, pageWidth, pageHeight);
        if (closeToPoint(firstPage, clickPage, screenThresholdToPage(CLOSE_SCREEN_PX, viewport))) {
          const closed = [...draftPolygon];
          const validationError = validatePolygon(closed);
          if (validationError) {
            setError(validationError);
            return;
          }
          useEditorStore.setState({ draftPolygon: closed });
          finishDraft();
          return;
        }
      }

      addDraftPoint(resolvePoint(normalized));
    }
  };

  const handleStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return;
    }

    if (isPanning.current) {
      panBy(pointer.x - lastPointer.current.x, pointer.y - lastPointer.current.y);
      lastPointer.current = pointer;
      return;
    }

    if (mode === "draw" || mode === "calibrate") {
      setDraftCursor(getNormalizedFromStage(stage));
    }
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
  };

  const handleSpaceClick = (spaceId: string) => {
    selectSpace(spaceId);
    if (mode === "view") {
      setMode("select");
    }
  };

  const applyCalibration = async () => {
    if (calibratePoints.length !== 2) {
      setError("Select exactly two points on the plan");
      return;
    }

    const a = denormalizePoint(calibratePoints[0], pageWidth, pageHeight);
    const b = denormalizePoint(calibratePoints[1], pageWidth, pageHeight);
    const pixelDistance = Math.hypot(a.x - b.x, a.y - b.y);
    const meters = Number(calibrateDistance);

    if (!meters || meters <= 0) {
      setError("Distance must be greater than zero");
      return;
    }

    try {
      const updated = await updateFloor(floor.id, { metersPerPixel: meters / pixelDistance });
      setFloor(updated);
      clearCalibrate();
      setMode("view");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calibration failed");
    }
  };

  const refreshSelectedGeometry = (polygon: Point[]) => {
    if (!selectedSpace) {
      return;
    }
    const geometricArea = polygonAreaM2(polygon, pageWidth, pageHeight, floor.metersPerPixel);
    updateSpaceLocal({ ...selectedSpace, polygon, geometricArea });
  };

  const handleVertexDragMove = (index: number, point: Point) => {
    if (!selectedSpace) {
      return;
    }
    const resolved = resolvePoint(point, selectedSpace.polygon[index]);
    refreshSelectedGeometry(
      selectedSpace.polygon.map((vertex, i) => (i === index ? resolved : vertex)),
    );
  };

  const handleVertexDragEnd = () => {
    if (!selectedSpace) {
      return;
    }
    pushHistory();
    markDirty(selectedSpace.id);
  };

  const handleVertexContextMenu = (index: number) => {
    if (!selectedSpace || selectedSpace.polygon.length <= 3) {
      return;
    }
    refreshSelectedGeometry(removeVertex(selectedSpace.polygon, index));
    pushHistory();
    markDirty(selectedSpace.id);
  };

  const handlePolygonDragStart = () => {
    polygonDragStarted.current = true;
  };

  const handlePolygonDragMove = (delta: Point) => {
    if (!selectedSpace) {
      return;
    }
    refreshSelectedGeometry(translatePolygon(selectedSpace.polygon, delta));
  };

  const handlePolygonDragEnd = () => {
    if (!selectedSpace || !polygonDragStarted.current) {
      return;
    }
    polygonDragStarted.current = false;
    pushHistory();
    markDirty(selectedSpace.id);
  };

  const handleEdgeDblClick = (point: Point) => {
    if (!selectedSpace) {
      return;
    }
    const edgeIndex = closestEdgeIndex(
      point,
      selectedSpace.polygon,
      pageWidth,
      pageHeight,
      screenThresholdToPage(12, viewport),
    );
    if (edgeIndex === null) {
      return;
    }
    refreshSelectedGeometry(insertPointOnEdge(selectedSpace.polygon, edgeIndex, point));
    pushHistory();
    markDirty(selectedSpace.id);
  };

  const cursor =
    mode === "draw" || mode === "calibrate"
      ? "crosshair"
      : mode === "view"
        ? "grab"
        : "default";

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden" style={{ cursor }}>
      {previewError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl bg-red-950 px-4 py-3 text-center text-sm text-red-100">
            {previewError}
          </div>
        </div>
      )}

      {loading && !ready && !previewError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/80 text-sm text-zinc-200">
          Loading floor plan...
        </div>
      )}

      {mode === "calibrate" && (
        <div className="absolute left-4 top-4 z-30 flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-950/95 p-3">
          <Input
            label="Known distance (m)"
            type="number"
            step="0.01"
            value={calibrateDistance}
            onChange={(event) => setCalibrateDistance(event.target.value)}
          />
          <Button variant="primary" onClick={applyCalibration}>
            Apply
          </Button>
          <Button variant="ghost" onClick={clearCalibrate}>
            Reset
          </Button>
        </div>
      )}

      {/* PDF preview — always keep mounted after URL is set */}
      {imageUrl && (
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left will-change-transform"
          style={{
            width: pageWidth > 1 ? pageWidth : "auto",
            height: pageHeight > 1 ? pageHeight : "auto",
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Floor plan"
            draggable={false}
            className="block max-w-none select-none bg-white shadow-lg"
            style={
              pageWidth > 1 && pageHeight > 1
                ? { width: pageWidth, height: pageHeight }
                : { maxWidth: "100%" }
            }
            onLoad={(event) => onImageLoad(event.currentTarget)}
            onError={onImageError}
            ref={(node) => {
              // Cached images may already be complete before onLoad binds.
              if (node?.complete && node.naturalWidth > 0 && !ready) {
                onImageLoad(node);
              }
            }}
          />
        </div>
      )}

      {stageSize.width > 0 && stageSize.height > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseUp}
        >
          <Layer>
            <SpaceLayer
              spaces={spaces}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              viewport={viewport}
              selectedSpaceId={selectedSpaceId}
              onSpaceClick={handleSpaceClick}
            />
          </Layer>

          <Layer>
            <SelectionLayer
              space={selectedSpace && (mode === "edit" || mode === "select") ? selectedSpace : null}
              mode={mode}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              viewport={viewport}
              onVertexDragMove={handleVertexDragMove}
              onVertexDragEnd={handleVertexDragEnd}
              onVertexContextMenu={handleVertexContextMenu}
              onPolygonDragStart={handlePolygonDragStart}
              onPolygonDragMove={handlePolygonDragMove}
              onPolygonDragEnd={handlePolygonDragEnd}
              onEdgeDblClick={handleEdgeDblClick}
            />
          </Layer>

          <Layer listening={false}>
            <DrawingLayer
              draftPolygon={draftPolygon}
              draftCursor={draftCursor}
              calibratePoints={calibratePoints}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              viewport={viewport}
              mode={mode}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
