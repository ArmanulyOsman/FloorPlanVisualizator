"use client";

import { create } from "zustand";
import type { EditorMode, Floor, Point, Space, Viewport } from "@/shared/types";
import { mergeHistorySnapshot } from "@/lib/space-history";
import {
  cloneSpaces,
  computeFitViewport,
  computeFocusViewport,
  polygonBounds,
  type FitMode,
} from "@/lib/viewport";

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;

type StageSize = { width: number; height: number };

type EditorState = {
  floor: Floor | null;
  pageWidth: number;
  pageHeight: number;
  stageSize: StageSize;
  spaces: Space[];
  mode: EditorMode;
  draftPolygon: Point[];
  draftCursor: Point | null;
  selectedSpaceId: string | null;
  hoveredSpaceId: string | null;
  pendingCreatePolygon: Point[] | null;
  calibratePoints: Point[];
  viewport: Viewport;
  history: Space[][];
  historyIndex: number;
  isSaving: boolean;
  error: string | null;
  dirtySpaceIds: Set<string>;
  isPanKeyDown: boolean;
  isRoomsPanelOpen: boolean;
  isShortcutsOpen: boolean;

  setFloor: (floor: Floor) => void;
  setPageSize: (width: number, height: number) => void;
  setStageSize: (size: StageSize) => void;
  updateFloorMeta: (floor: Partial<Floor> & { width?: number; height?: number }) => void;
  setSpaces: (spaces: Space[]) => void;
  setMode: (mode: EditorMode) => void;
  setViewport: (viewport: Viewport) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (pointerX: number, pointerY: number, factor: number) => void;
  zoomBy: (factor: number) => void;
  fitView: (mode?: FitMode) => void;
  focusSpace: (spaceId: string) => void;
  ensureSpaceVisible: (spaceId: string) => void;

  selectSpace: (id: string | null) => void;
  hoverSpace: (id: string | null) => void;
  addDraftPoint: (point: Point) => void;
  popDraftPoint: () => void;
  setDraftCursor: (point: Point | null) => void;
  clearDraft: () => void;
  finishDraft: (polygon?: Point[]) => void;
  cancelCreate: () => void;

  updateSpaceLocal: (space: Space) => void;
  addSpaceLocal: (space: Space) => void;
  removeSpaceLocal: (id: string) => void;
  updateSpacePolygon: (id: string, polygon: Point[]) => void;

  addCalibratePoint: (point: Point) => void;
  clearCalibrate: () => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  markDirty: (id: string) => void;
  clearDirty: (id: string) => void;
  setIsSaving: (value: boolean) => void;
  setError: (error: string | null) => void;
  setPanKeyDown: (value: boolean) => void;
  toggleRoomsPanel: () => void;
  setShortcutsOpen: (value: boolean) => void;
  resetEditor: () => void;
};

const initialViewport: Viewport = { scale: 1, x: 40, y: 40 };

const initialState = {
  floor: null,
  pageWidth: 1,
  pageHeight: 1,
  stageSize: { width: 0, height: 0 },
  spaces: [],
  mode: "view" as EditorMode,
  draftPolygon: [],
  draftCursor: null,
  selectedSpaceId: null,
  hoveredSpaceId: null,
  pendingCreatePolygon: null,
  calibratePoints: [],
  viewport: initialViewport,
  history: [],
  historyIndex: -1,
  isSaving: false,
  error: null,
  dirtySpaceIds: new Set<string>(),
  isPanKeyDown: false,
  isShortcutsOpen: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  isRoomsPanelOpen: true,

  setFloor: (floor) => {
    const spaces = floor.spaces;
    set({
      floor,
      pageWidth: floor.width,
      pageHeight: floor.height,
      spaces,
      history: [cloneSpaces(spaces)],
      historyIndex: 0,
      dirtySpaceIds: new Set(),
    });
  },

  setPageSize: (width, height) => set({ pageWidth: width, pageHeight: height }),
  setStageSize: (size) =>
    set((state) =>
      state.stageSize.width === size.width && state.stageSize.height === size.height
        ? state
        : { stageSize: size },
    ),

  updateFloorMeta: (floor) =>
    set((state) => ({
      floor: state.floor ? { ...state.floor, ...floor, spaces: state.spaces } : state.floor,
      pageWidth: floor.width ?? state.pageWidth,
      pageHeight: floor.height ?? state.pageHeight,
    })),

  setSpaces: (spaces) => set({ spaces }),

  setMode: (mode) =>
    set((state) => ({
      mode,
      draftPolygon: [],
      draftCursor: null,
      calibratePoints: mode === "calibrate" ? [] : state.calibratePoints,
      selectedSpaceId: mode === "draw" ? null : state.selectedSpaceId,
    })),

  setViewport: (viewport) => set({ viewport }),

  panBy: (dx, dy) =>
    set((state) => ({
      viewport: { ...state.viewport, x: state.viewport.x + dx, y: state.viewport.y + dy },
    })),

  zoomAt: (pointerX, pointerY, factor) =>
    set((state) => {
      const { scale, x, y } = state.viewport;
      const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
      const ratio = newScale / scale;
      return {
        viewport: {
          scale: newScale,
          x: pointerX - (pointerX - x) * ratio,
          y: pointerY - (pointerY - y) * ratio,
        },
      };
    }),

  zoomBy: (factor) => {
    const { stageSize, zoomAt } = get();
    zoomAt(stageSize.width / 2, stageSize.height / 2, factor);
  },

  fitView: (mode = "page") => {
    const { stageSize, pageWidth, pageHeight } = get();
    if (pageWidth <= 1 || pageHeight <= 1 || stageSize.width < 32 || stageSize.height < 32) {
      return;
    }
    set({
      viewport: computeFitViewport(
        stageSize.width,
        stageSize.height,
        pageWidth,
        pageHeight,
        mode,
        24,
      ),
    });
  },

  focusSpace: (spaceId) => {
    const { spaces, stageSize, pageWidth, pageHeight } = get();
    const space = spaces.find((item) => item.id === spaceId);
    if (!space) {
      return;
    }

    const viewport = computeFocusViewport(
      stageSize.width,
      stageSize.height,
      pageWidth,
      pageHeight,
      space.polygon,
    );

    if (viewport) {
      set({ viewport });
    }
  },

  /** Recenters only when the room is off screen, so browsing the list does not jump the view. */
  ensureSpaceVisible: (spaceId) => {
    const { spaces, stageSize, pageWidth, pageHeight, viewport, focusSpace } = get();
    const space = spaces.find((item) => item.id === spaceId);
    const bounds = space ? polygonBounds(space.polygon) : null;
    if (!bounds) {
      return;
    }

    const margin = 24;
    const left = bounds.minX * pageWidth * viewport.scale + viewport.x;
    const right = bounds.maxX * pageWidth * viewport.scale + viewport.x;
    const top = bounds.minY * pageHeight * viewport.scale + viewport.y;
    const bottom = bounds.maxY * pageHeight * viewport.scale + viewport.y;

    const visible =
      left >= margin &&
      top >= margin &&
      right <= stageSize.width - margin &&
      bottom <= stageSize.height - margin;

    if (!visible) {
      focusSpace(spaceId);
    }
  },

  selectSpace: (id) => set({ selectedSpaceId: id }),
  hoverSpace: (id) => set((state) => (state.hoveredSpaceId === id ? state : { hoveredSpaceId: id })),

  addDraftPoint: (point) => set((state) => ({ draftPolygon: [...state.draftPolygon, point] })),
  popDraftPoint: () => set((state) => ({ draftPolygon: state.draftPolygon.slice(0, -1) })),
  setDraftCursor: (point) => set({ draftCursor: point }),
  clearDraft: () => set({ draftPolygon: [], draftCursor: null }),

  finishDraft: (polygon) => {
    const candidate = polygon ?? get().draftPolygon;
    if (candidate.length >= 3) {
      set({
        pendingCreatePolygon: candidate.map((point) => ({ ...point })),
        draftPolygon: [],
        draftCursor: null,
        mode: "select",
      });
    }
  },

  cancelCreate: () => set({ pendingCreatePolygon: null }),

  updateSpaceLocal: (space) =>
    set((state) => ({
      spaces: state.spaces.map((item) => (item.id === space.id ? space : item)),
    })),

  addSpaceLocal: (space) => set((state) => ({ spaces: [...state.spaces, space] })),

  removeSpaceLocal: (id) =>
    set((state) => ({
      spaces: state.spaces.filter((item) => item.id !== id),
      selectedSpaceId: state.selectedSpaceId === id ? null : state.selectedSpaceId,
      hoveredSpaceId: state.hoveredSpaceId === id ? null : state.hoveredSpaceId,
    })),

  updateSpacePolygon: (id, polygon) =>
    set((state) => ({
      spaces: state.spaces.map((item) =>
        item.id === id ? { ...item, polygon: polygon.map((p) => ({ ...p })) } : item,
      ),
    })),

  addCalibratePoint: (point) =>
    set((state) => ({
      calibratePoints:
        state.calibratePoints.length >= 2 ? [point] : [...state.calibratePoints, point],
    })),

  clearCalibrate: () => set({ calibratePoints: [] }),

  pushHistory: () => {
    const { spaces, history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(cloneSpaces(spaces));
    set({ history: trimmed.slice(-50), historyIndex: Math.min(trimmed.length, 50) - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) {
      return;
    }
    applySnapshot(set, get, historyIndex - 1, history);
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) {
      return;
    }
    applySnapshot(set, get, historyIndex + 1, history);
  },

  markDirty: (id) =>
    set((state) => {
      const next = new Set(state.dirtySpaceIds);
      next.add(id);
      return { dirtySpaceIds: next };
    }),

  clearDirty: (id) =>
    set((state) => {
      const next = new Set(state.dirtySpaceIds);
      next.delete(id);
      return { dirtySpaceIds: next };
    }),

  setIsSaving: (value) => set({ isSaving: value }),
  setError: (error) => set({ error }),
  setPanKeyDown: (value) =>
    set((state) => (state.isPanKeyDown === value ? state : { isPanKeyDown: value })),
  toggleRoomsPanel: () => set((state) => ({ isRoomsPanelOpen: !state.isRoomsPanelOpen })),
  setShortcutsOpen: (value) => set({ isShortcutsOpen: value }),

  resetEditor: () => set({ ...initialState, dirtySpaceIds: new Set() }),
}));

type SetState = (partial: Partial<EditorState>) => void;
type GetState = () => EditorState;

function applySnapshot(set: SetState, get: GetState, index: number, history: Space[][]) {
  const { spaces: merged, changedIds } = mergeHistorySnapshot(get().spaces, history[index]);
  const dirty = new Set(get().dirtySpaceIds);
  changedIds.forEach((id) => dirty.add(id));
  set({ spaces: merged, historyIndex: index, dirtySpaceIds: dirty });
}
