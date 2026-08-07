"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { validatePolygon } from "@/lib/polygon-validation";

export function useKeyboardShortcuts() {
  const draftPolygon = useEditorStore((state) => state.draftPolygon);
  const mode = useEditorStore((state) => state.mode);
  const pendingCreatePolygon = useEditorStore((state) => state.pendingCreatePolygon);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const store = useEditorStore.getState();

      if (event.key === "Escape") {
        if (store.pendingCreatePolygon) {
          store.cancelCreate();
        } else if (store.mode === "draw") {
          store.clearDraft();
          store.setMode("view");
        } else {
          store.selectSpace(null);
        }
      }

      if (event.key === "Backspace" && store.mode === "draw" && !store.pendingCreatePolygon) {
        event.preventDefault();
        store.popDraftPoint();
      }

      if (event.key === "Enter" && store.mode === "draw" && store.draftPolygon.length >= 3) {
        const validationError = validatePolygon(store.draftPolygon);
        if (!validationError) {
          store.finishDraft();
        } else {
          store.setError(validationError);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("editor:save"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draftPolygon, mode, pendingCreatePolygon]);
}
