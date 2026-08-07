"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { requestSave } from "@/features/floor-editor/actions";
import { PropertiesPanel } from "@/features/floor-editor/components/PropertiesPanel";
import { RoomsPanel } from "@/features/floor-editor/components/RoomsPanel";
import { ShortcutsDialog } from "@/features/floor-editor/components/ShortcutsDialog";
import { StatusBar } from "@/features/floor-editor/components/StatusBar";
import { Toolbar } from "@/features/floor-editor/components/Toolbar";
import { FloorStage } from "@/features/floor-editor/components/FloorStageLoader";
import { useAutosave } from "@/features/floor-editor/hooks/useAutosave";
import { useKeyboardShortcuts } from "@/features/floor-editor/hooks/useKeyboardShortcuts";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { getFloor } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { ArrowLeftIcon, SaveIcon, SpinnerIcon } from "@/shared/ui/icons";
import { Toaster, toast } from "@/shared/ui/toast";

type FloorEditorProps = {
  floorId: string;
};

function SaveState() {
  const isSaving = useEditorStore((state) => state.isSaving);
  const dirtyCount = useEditorStore((state) => state.dirtySpaceIds.size);

  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
        <SpinnerIcon className="h-3.5 w-3.5" />
        Saving
      </span>
    );
  }

  if (dirtyCount > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {dirtyCount} unsaved
      </span>
    );
  }

  return <span className="text-xs text-zinc-600">All changes saved</span>;
}

export function FloorEditor({ floorId }: FloorEditorProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const floor = useEditorStore((state) => state.floor);
  const spaceCount = useEditorStore((state) => state.spaces.length);
  const error = useEditorStore((state) => state.error);
  const isSaving = useEditorStore((state) => state.isSaving);
  const dirtyCount = useEditorStore((state) => state.dirtySpaceIds.size);
  const isRoomsPanelOpen = useEditorStore((state) => state.isRoomsPanelOpen);
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
          setLoadError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message);
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
  }, [floorId, setFloor, resetEditor]);

  // Store errors are transient; surface them as toasts so nothing stays stuck in the chrome.
  useEffect(() => {
    if (error) {
      toast(error, "error");
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    if (dirtyCount === 0) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyCount]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 bg-zinc-950 text-sm text-zinc-400">
        <SpinnerIcon className="h-5 w-5" />
        Loading floor...
      </div>
    );
  }

  if (loadError && !floor) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <p className="text-sm text-red-300">{loadError}</p>
        <p className="max-w-sm text-xs text-zinc-500">
          Check that the backend is running on the configured API URL, then reload the page.
        </p>
        <Link href="/buildings">
          <Button variant="secondary" icon={<ArrowLeftIcon className="h-4 w-4" />}>
            Back to buildings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={floor ? `/buildings/${floor.buildingId}` : "/buildings"}
            aria-label="Back to building"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{floor?.name ?? "Floor editor"}</h1>
            <p className="truncate text-xs text-zinc-500">
              Floor {floor?.number} · {spaceCount} {spaceCount === 1 ? "room" : "rooms"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <SaveState />
          <Button
            variant="primary"
            icon={<SaveIcon className="h-4 w-4" />}
            onClick={requestSave}
            disabled={isSaving || dirtyCount === 0}
          >
            Save
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Toolbar />
        {isRoomsPanelOpen && <RoomsPanel />}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-zinc-800">
            {floor && <FloorStage />}
            <PropertiesPanel />
          </div>
          <StatusBar />
        </div>
      </div>

      <ShortcutsDialog />
      <Toaster />
    </div>
  );
}
