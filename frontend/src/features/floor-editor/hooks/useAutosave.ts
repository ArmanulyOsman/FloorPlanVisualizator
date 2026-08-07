"use client";

import { useEffect, useRef } from "react";
import { updateSpace } from "@/shared/api/spaces";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";

const AUTOSAVE_DELAY_MS = 1000;

export function useAutosave() {
  const dirtySpaceIds = useEditorStore((state) => state.dirtySpaceIds);
  const spaces = useEditorStore((state) => state.spaces);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDirtySpaces = async () => {
    const store = useEditorStore.getState();
    const ids = [...store.dirtySpaceIds];
    if (ids.length === 0) {
      return;
    }

    store.setIsSaving(true);
    store.setError(null);

    try {
      for (const id of ids) {
        const space = store.spaces.find((item) => item.id === id);
        if (!space) {
          continue;
        }

        const updated = await updateSpace(id, {
          number: space.number,
          name: space.name,
          type: space.type,
          status: space.status,
          polygon: space.polygon,
          rentableArea: space.rentableArea,
          notes: space.notes,
        });
        store.updateSpaceLocal(updated);
        store.clearDirty(id);
      }
    } catch (error) {
      store.setError(error instanceof Error ? error.message : "Autosave failed");
    } finally {
      store.setIsSaving(false);
    }
  };

  useEffect(() => {
    if (dirtySpaceIds.size === 0) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void saveDirtySpaces();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [dirtySpaceIds, spaces]);

  useEffect(() => {
    const onSave = () => {
      void saveDirtySpaces();
    };
    window.addEventListener("editor:save", onSave);
    return () => window.removeEventListener("editor:save", onSave);
  }, []);
}
