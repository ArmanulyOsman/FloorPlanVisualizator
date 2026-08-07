"use client";

import { useEffect, useRef } from "react";
import { SAVE_EVENT } from "@/features/floor-editor/actions";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { updateSpace } from "@/shared/api/spaces";
import { toast } from "@/shared/ui/toast";

const AUTOSAVE_DELAY_MS = 1200;

async function saveDirtySpaces() {
  const store = useEditorStore.getState();
  const ids = [...store.dirtySpaceIds];
  if (ids.length === 0 || store.isSaving) {
    return;
  }

  store.setIsSaving(true);

  try {
    for (const id of ids) {
      const space = useEditorStore.getState().spaces.find((item) => item.id === id);
      if (!space) {
        store.clearDirty(id);
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
    toast(error instanceof Error ? error.message : "Could not save changes", "error");
  } finally {
    store.setIsSaving(false);
  }
}

/** Debounced persistence of geometry edits, plus an explicit save trigger. */
export function useAutosave() {
  const dirtySpaceIds = useEditorStore((state) => state.dirtySpaceIds);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dirtySpaceIds.size === 0) {
      return;
    }

    timerRef.current = setTimeout(() => void saveDirtySpaces(), AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [dirtySpaceIds]);

  useEffect(() => {
    const onSave = () => void saveDirtySpaces();
    window.addEventListener(SAVE_EVENT, onSave);
    return () => window.removeEventListener(SAVE_EVENT, onSave);
  }, []);
}
