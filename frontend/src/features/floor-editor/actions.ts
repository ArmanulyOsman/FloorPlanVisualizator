"use client";

import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { deleteSpace } from "@/shared/api/spaces";
import { toast } from "@/shared/ui/toast";

export const SAVE_EVENT = "editor:save";

export function requestSave() {
  window.dispatchEvent(new CustomEvent(SAVE_EVENT));
}

export async function removeSpace(spaceId: string): Promise<boolean> {
  const store = useEditorStore.getState();
  const space = store.spaces.find((item) => item.id === spaceId);
  if (!space) {
    return false;
  }

  if (!window.confirm(`Delete room ${space.number}${space.name ? ` — ${space.name}` : ""}?`)) {
    return false;
  }

  store.setIsSaving(true);

  try {
    await deleteSpace(spaceId);
    store.removeSpaceLocal(spaceId);
    store.clearDirty(spaceId);
    store.pushHistory();
    store.setMode("select");
    toast(`Room ${space.number} deleted`, "success");
    return true;
  } catch (error) {
    toast(error instanceof Error ? error.message : "Failed to delete room", "error");
    return false;
  } finally {
    store.setIsSaving(false);
  }
}
