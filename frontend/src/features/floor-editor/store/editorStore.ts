"use client";

import { create } from "zustand";
import type { EditorMode, Floor, Point, Space, Viewport } from "@/shared/types";
import { cloneSpaces } from "@/lib/viewport";

type EditorState = {
  floor: Floor | null;
  pageWidth: number;
  pageHeight: number;
  spaces: Space[];
  mode: EditorMode;
  draftPolygon: Point[];
  draftCursor: Point | null;
  selectedSpaceId: string | null;
  pendingCreatePolygon: Point[] | null;
  calibratePoints: Point[];
  viewport: Viewport;
  history: Space[][];
  historyIndex: number;
  isSaving: boolean;
  error: string | null;
  dirtySpaceIds: Set<string>;

  setFloor: (floor: Floor) => void;
  setPageSize: (width: number, height: number) => void;
  updateFloorMeta: (floor: Partial<Floor> & { width?: number; height?: number }) => void;
  setSpaces: (spaces: Space[]) => void;
  setMode: (mode: EditorMode) => void;
  setViewport: (viewport: Viewport) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (pointerX: number, pointerY: number, factor: number) => void;

  selectSpace: (id: string | null) => void;
  addDraftPoint: (point: Point) => void;
  popDraftPoint: () => void;
  setDraftCursor: (point: Point | null) => void;
  clearDraft: () => void;
  finishDraft: () => void;
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
  resetEditor: () => void;
};

const initialViewport: Viewport = { scale: 1, x: 40, y: 40 };

export const useEditorStore = create<EditorState>((set, get) => ({
  floor: null,
  pageWidth: 1,
  pageHeight: 1,
  spaces: [],
  mode: "view",
  draftPolygon: [],
  draftCursor: null,
  selectedSpaceId: null,
  pendingCreatePolygon: null,
  calibratePoints: [],
  viewport: initialViewport,
  history: [],
  historyIndex: -1,
  isSaving: false,
  error: null,
  dirtySpaceIds: new Set(),

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
  updateFloorMeta: (floor) =>
    set((state) => ({
      floor: state.floor ? { ...state.floor, ...floor, spaces: state.spaces } : state.floor,
      pageWidth: floor.width ?? state.pageWidth,
      pageHeight: floor.height ?? state.pageHeight,
    })),

  setSpaces: (spaces) => set({ spaces }),

  setMode: (mode) =>
    set({
      mode,
      draftPolygon: [],
      draftCursor: null,
      calibratePoints: mode === "calibrate" ? [] : get().calibratePoints,
      selectedSpaceId: mode === "draw" ? null : get().selectedSpaceId,
    }),

  setViewport: (viewport) => set({ viewport }),

  panBy: (dx, dy) =>
    set((state) => ({
      viewport: { ...state.viewport, x: state.viewport.x + dx, y: state.viewport.y + dy },
    })),

  zoomAt: (pointerX, pointerY, factor) =>
    set((state) => {
      const { scale, x, y } = state.viewport;
      const newScale = Math.min(Math.max(scale * factor, 0.05), 20);
      const ratio = newScale / scale;
      return {
        viewport: {
          scale: newScale,
          x: pointerX - (pointerX - x) * ratio,
          y: pointerY - (pointerY - y) * ratio,
        },
      };
    }),

  selectSpace: (id) => set({ selectedSpaceId: id }),

  addDraftPoint: (point) =>
    set((state) => ({ draftPolygon: [...state.draftPolygon, point] })),

  popDraftPoint: () =>
    set((state) => ({ draftPolygon: state.draftPolygon.slice(0, -1) })),

  setDraftCursor: (point) => set({ draftCursor: point }),

  clearDraft: () => set({ draftPolygon: [], draftCursor: null }),

  finishDraft: () => {
    const { draftPolygon } = get();
    if (draftPolygon.length >= 3) {
      set({ pendingCreatePolygon: [...draftPolygon], draftPolygon: [], draftCursor: null, mode: "select" });
    }
  },

  cancelCreate: () => set({ pendingCreatePolygon: null }),

  updateSpaceLocal: (space) =>
    set((state) => ({
      spaces: state.spaces.map((item) => (item.id === space.id ? space : item)),
    })),

  addSpaceLocal: (space) =>
    set((state) => ({ spaces: [...state.spaces, space] })),

  removeSpaceLocal: (id) =>
    set((state) => ({
      spaces: state.spaces.filter((item) => item.id !== id),
      selectedSpaceId: state.selectedSpaceId === id ? null : state.selectedSpaceId,
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
    const snapshot = cloneSpaces(spaces);
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(snapshot);
    set({ history: trimmed, historyIndex: trimmed.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) {
      return;
    }
    const newIndex = historyIndex - 1;
    set({ spaces: cloneSpaces(history[newIndex]), historyIndex: newIndex });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) {
      return;
    }
    const newIndex = historyIndex + 1;
    set({ spaces: cloneSpaces(history[newIndex]), historyIndex: newIndex });
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

  resetEditor: () =>
    set({
      floor: null,
      pageWidth: 1,
      pageHeight: 1,
      spaces: [],
      mode: "view",
      draftPolygon: [],
      draftCursor: null,
      selectedSpaceId: null,
      pendingCreatePolygon: null,
      calibratePoints: [],
      viewport: initialViewport,
      history: [],
      historyIndex: -1,
      isSaving: false,
      error: null,
      dirtySpaceIds: new Set(),
    }),
}));
