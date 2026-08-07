"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import { CalibrationPanel } from "@/features/floor-editor/components/CalibrationPanel";
import { PdfPreview } from "@/features/floor-editor/components/PdfPreview";
import { DrawingLayer } from "@/features/floor-editor/components/layers/DrawingLayer";
import { SelectionLayer } from "@/features/floor-editor/components/layers/SelectionLayer";
import { SpaceLayer } from "@/features/floor-editor/components/layers/SpaceLayer";
import { useFloorPreview } from "@/features/floor-editor/hooks/useFloorPreview";
import { useSnapping } from "@/features/floor-editor/hooks/useSnapping";
import { useSpaceEditing } from "@/features/floor-editor/hooks/useSpaceEditing";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { denormalizePoint } from "@/lib/coordinates";
import { closeToPoint, isPointInPolygon } from "@/lib/geometry";
import { validatePolygon } from "@/lib/polygon-validation";
import { screenThresholdToPage, screenToNormalized } from "@/lib/viewport";
import { SpinnerIcon } from "@/shared/ui/icons";
import { toast } from "@/shared/ui/toast";
import type { Point, Space } from "@/shared/types";

const CLOSE_SCREEN_PX = 12;
const PAN_TOLERANCE_PX = 4;
const DOUBLE_CLICK_MS = 400;
const DOUBLE_CLICK_PX = 6;

function hitTest(spaces: Space[], point: Point): Space | null {
  for (let i = spaces.length - 1; i >= 0; i--) {
    if (spaces[i].status !== "Hidden" && isPointInPolygon(point, spaces[i].polygon)) {
      return spaces[i];
    }
  }
  return null;
}

export function FloorStage() {
  const floor = useEditorStore((state) => state.floor);
  const spaces = useEditorStore((state) => state.spaces);
  const mode = useEditorStore((state) => state.mode);
  const viewport = useEditorStore((state) => state.viewport);
  const draftPolygon = useEditorStore((state) => state.draftPolygon);
  const draftCursor = useEditorStore((state) => state.draftCursor);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const hoveredSpaceId = useEditorStore((state) => state.hoveredSpaceId);
  const calibratePoints = useEditorStore((state) => state.calibratePoints);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const stageSize = useEditorStore((state) => state.stageSize);
  const isPanKeyDown = useEditorStore((state) => state.isPanKeyDown);

  const setStageSize = useEditorStore((state) => state.setStageSize);
  const panBy = useEditorStore((state) => state.panBy);
  const zoomAt = useEditorStore((state) => state.zoomAt);
  const fitView = useEditorStore((state) => state.fitView);
  const addDraftPoint = useEditorStore((state) => state.addDraftPoint);
  const setDraftCursor = useEditorStore((state) => state.setDraftCursor);
  const selectSpace = useEditorStore((state) => state.selectSpace);
  const hoverSpace = useEditorStore((state) => state.hoverSpace);
  const setMode = useEditorStore((state) => state.setMode);
  const finishDraft = useEditorStore((state) => state.finishDraft);
  const addCalibratePoint = useEditorStore((state) => state.addCalibratePoint);

  const { imageUrl, loading, error: previewError, ready, onImageLoad, onImageError } =
    useFloorPreview(floor);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const panning = useRef(false);
  const panMoved = useRef(false);
  const pendingDeselect = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastClick = useRef({ time: 0, x: 0, y: 0 });
  const fittedFloorId = useRef<string | null>(null);
  const [isPanningNow, setIsPanningNow] = useState(false);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const resolvePoint = useSnapping();
  const editing = useSpaceEditing(selectedSpace);

  const measure = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) {
      return;
    }
    setStageSize({
      width: Math.max(Math.floor(element.clientWidth), 0),
      height: Math.max(Math.floor(element.clientHeight), 0),
    });
  }, [setStageSize]);

  useLayoutEffect(() => {
    measure();
    const element = wrapperRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, floor?.id]);

  // Fit once per plan. Later resizes must not throw away the zoom the user chose.
  useEffect(() => {
    const canFit =
      ready && pageWidth > 1 && pageHeight > 1 && stageSize.width >= 32 && stageSize.height >= 32;

    if (canFit && floor?.id && fittedFloorId.current !== floor.id) {
      fittedFloorId.current = floor.id;
      fitView("page");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, floor?.id, pageWidth, pageHeight, stageSize.width, stageSize.height]);

  const getNormalized = (stage: Konva.Stage): Point | null => {
    const pointer = stage.getPointerPosition();
    if (!pointer) {
      return null;
    }
    return screenToNormalized(pointer.x, pointer.y, viewport, pageWidth, pageHeight);
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) {
      return;
    }

    const { deltaX, deltaY, ctrlKey, metaKey, shiftKey } = event.evt;

    if (shiftKey && !ctrlKey && !metaKey) {
      panBy(-deltaY - deltaX, 0);
      return;
    }

    // Trackpad two-finger panning reports horizontal delta; wheels and pinch gestures zoom.
    if (!ctrlKey && !metaKey && Math.abs(deltaX) > 0) {
      panBy(-deltaX, -deltaY);
      return;
    }

    const factor = Math.min(Math.max(Math.exp(-deltaY * 0.002), 0.8), 1.25);
    zoomAt(pointer.x, pointer.y, factor);
  };

  const startPan = (stage: Konva.Stage) => {
    panning.current = true;
    panMoved.current = false;
    lastPointer.current = stage.getPointerPosition() ?? { x: 0, y: 0 };
    setIsPanningNow(true);
  };

  const handleMouseDown = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    const onBackground = event.target === stage;
    const forcedPan =
      event.evt.button === 1 || (event.evt.button === 0 && (event.evt.altKey || isPanKeyDown));

    if (forcedPan) {
      event.evt.preventDefault();
      startPan(stage);
      return;
    }

    if (event.evt.button !== 0) {
      return;
    }

    const normalized = getNormalized(stage);
    if (!normalized) {
      return;
    }

    if (mode === "calibrate") {
      addCalibratePoint(normalized);
      return;
    }

    if (mode === "draw") {
      handleDrawClick(normalized, stage.getPointerPosition());
      return;
    }

    const hit = hitTest(spaces, normalized);
    if (hit) {
      selectSpace(hit.id);
      if (mode === "view") {
        setMode("select");
      }
    }

    // Dragging the background pans; a click without movement clears the selection.
    if (onBackground) {
      pendingDeselect.current = !hit;
      startPan(stage);
    }
  };

  const handleDrawClick = (normalized: Point, pointer: Point | null) => {
    // Konva's own dblclick ignores distance, which would close a polygon while the user is
    // still clicking corners quickly. Require the two clicks to land on the same spot.
    const now = Date.now();
    const repeated =
      pointer !== null &&
      now - lastClick.current.time < DOUBLE_CLICK_MS &&
      Math.hypot(pointer.x - lastClick.current.x, pointer.y - lastClick.current.y) <
        DOUBLE_CLICK_PX;

    lastClick.current = { time: now, x: pointer?.x ?? 0, y: pointer?.y ?? 0 };

    if (repeated) {
      if (draftPolygon.length >= 3) {
        completeDraft(draftPolygon);
      }
      return;
    }

    if (draftPolygon.length >= 3) {
      const first = denormalizePoint(draftPolygon[0], pageWidth, pageHeight);
      const click = denormalizePoint(normalized, pageWidth, pageHeight);
      if (closeToPoint(first, click, screenThresholdToPage(CLOSE_SCREEN_PX, viewport))) {
        completeDraft(draftPolygon);
        return;
      }
    }

    addDraftPoint(resolvePoint(normalized));
  };

  const completeDraft = (polygon: Point[]) => {
    const validationError = validatePolygon(polygon);
    if (validationError) {
      toast(validationError, "error");
      return;
    }
    finishDraft(polygon);
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return;
    }

    if (panning.current) {
      const dx = pointer.x - lastPointer.current.x;
      const dy = pointer.y - lastPointer.current.y;
      if (Math.abs(dx) > PAN_TOLERANCE_PX || Math.abs(dy) > PAN_TOLERANCE_PX) {
        panMoved.current = true;
      }
      panBy(dx, dy);
      lastPointer.current = pointer;
      return;
    }

    if (mode === "draw" || mode === "calibrate") {
      setDraftCursor(getNormalized(stage));
      return;
    }

    const normalized = getNormalized(stage);
    hoverSpace(normalized ? (hitTest(spaces, normalized)?.id ?? null) : null);
  };

  const endPan = () => {
    if (pendingDeselect.current && !panMoved.current) {
      selectSpace(null);
    }
    pendingDeselect.current = false;
    panning.current = false;
    panMoved.current = false;
    setIsPanningNow(false);
  };

  const handleMouseLeave = () => {
    endPan();
    hoverSpace(null);
    setDraftCursor(null);
  };

  const cursor = (() => {
    if (isPanningNow) {
      return "grabbing";
    }
    if (isPanKeyDown) {
      return "grab";
    }
    if (mode === "draw" || mode === "calibrate") {
      return "crosshair";
    }
    if (hoveredSpaceId) {
      return "pointer";
    }
    return mode === "view" ? "grab" : "default";
  })();

  if (!floor) {
    return null;
  }

  return (
    <div ref={wrapperRef} className="editor-canvas relative h-full w-full overflow-hidden" style={{ cursor }}>
      {imageUrl && (
        <PdfPreview
          imageUrl={imageUrl}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          viewport={viewport}
          ready={ready}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
      )}

      {stageSize.width > 0 && stageSize.height > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endPan}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(event) => event.evt.preventDefault()}
        >
          <Layer listening={false}>
            <SpaceLayer
              spaces={spaces}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              viewport={viewport}
              selectedSpaceId={selectedSpaceId}
              hoveredSpaceId={hoveredSpaceId}
            />
          </Layer>

          <Layer>
            <SelectionLayer
              space={selectedSpace && mode !== "draw" ? selectedSpace : null}
              mode={mode}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              viewport={viewport}
              {...editing}
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

      {mode === "calibrate" && <CalibrationPanel />}

      {loading && !ready && !previewError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-900/80 text-sm text-zinc-300">
          <SpinnerIcon className="h-6 w-6" />
          Rendering floor plan...
        </div>
      )}

      {previewError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-red-900 bg-red-950/90 px-4 py-3 text-center text-sm text-red-100">
            {previewError}
          </div>
        </div>
      )}
    </div>
  );
}
