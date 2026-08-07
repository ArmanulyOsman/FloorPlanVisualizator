"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getFloor } from "@/shared/api/floors";
import { FloorStage } from "@/features/floor-editor/components/FloorStageLoader";
import { PropertiesPanel } from "@/features/floor-editor/components/PropertiesPanel";
import { Toolbar } from "@/features/floor-editor/components/Toolbar";
import { useAutosave } from "@/features/floor-editor/hooks/useAutosave";
import { useKeyboardShortcuts } from "@/features/floor-editor/hooks/useKeyboardShortcuts";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";

type FloorEditorProps = {
  floorId: string;
};

export function FloorEditor({ floorId }: FloorEditorProps) {
  const fitRef = useRef<((mode?: "width" | "page") => void) | null>(null);
  const [loading, setLoading] = useState(true);

  const floor = useEditorStore((state) => state.floor);
  const error = useEditorStore((state) => state.error);
  const isSaving = useEditorStore((state) => state.isSaving);
  const setFloor = useEditorStore((state) => state.setFloor);
  const setError = useEditorStore((state) => state.setError);
  const resetEditor = useEditorStore((state) => state.resetEditor);

  useKeyboardShortcuts();
  useAutosave();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    getFloor(floorId)
      .then((data) => {
        if (!cancelled) {
          setFloor(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      resetEditor();
    };
  }, [floorId, setFloor, setError, resetEditor]);

  const onReadyFit = useCallback((fit: (mode?: "width" | "page") => void) => {
    fitRef.current = fit;
  }, []);

  const fitWidth = () => {
    fitRef.current?.("width");
  };

  const fitPage = () => fitRef.current?.("page");

  const handleSave = () => {
    window.dispatchEvent(new CustomEvent("editor:save"));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading floor...
      </div>
    );
  }

  if (error && !floor) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-red-300">
        <p>{error}</p>
        <Link href="/buildings" className="text-blue-400 hover:underline">
          Back to buildings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={floor ? `/buildings/${floor.buildingId}` : "/buildings"}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-base font-semibold">{floor?.name ?? "Floor Editor"}</h1>
            <p className="text-xs text-zinc-500">
              View: drag pan · Scroll zoom · Draw: Enter finish · Ctrl+Z undo · Ctrl+S save
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && <span className="text-xs text-zinc-500">Saving...</span>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Toolbar onFitWidth={fitWidth} onFitPage={fitPage} onSave={handleSave} />
        <div className="relative min-h-0 min-w-0 flex-1 bg-zinc-700">
          {floor && <FloorStage onReadyFit={onReadyFit} />}
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}
