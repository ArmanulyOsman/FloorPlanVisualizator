"use client";

import { useEffect } from "react";
import { removeSpace, requestSave } from "@/features/floor-editor/actions";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { validatePolygon } from "@/lib/polygon-validation";
import { toast } from "@/shared/ui/toast";
import type { EditorMode } from "@/shared/types";

const TOOL_KEYS: Record<string, EditorMode> = {
  v: "view",
  s: "select",
  d: "draw",
  e: "edit",
  c: "calibrate",
};

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable
  );
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useEditorStore.getState();
      const typing = isTypingTarget(event.target);

      // Escape and save must work even while a form field has focus.
      if (event.key === "Escape") {
        if (store.isShortcutsOpen) {
          store.setShortcutsOpen(false);
        } else if (store.pendingCreatePolygon) {
          store.cancelCreate();
        } else if (store.mode === "draw") {
          store.clearDraft();
          store.setMode("select");
        } else {
          store.selectSpace(null);
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        requestSave();
        return;
      }

      if (typing) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.code === "Space" && !store.isPanKeyDown) {
        event.preventDefault();
        store.setPanKeyDown(true);
        return;
      }

      if (store.mode === "draw") {
        if (event.key === "Backspace") {
          event.preventDefault();
          store.popDraftPoint();
          return;
        }

        if (event.key === "Enter" && store.draftPolygon.length >= 3) {
          const validationError = validatePolygon(store.draftPolygon);
          if (validationError) {
            toast(validationError, "error");
          } else {
            store.finishDraft();
          }
          return;
        }
      }

      if ((event.key === "Delete" || event.key === "Backspace") && store.selectedSpaceId) {
        event.preventDefault();
        void removeSpace(store.selectedSpaceId);
        return;
      }

      if (event.key === "?") {
        store.setShortcutsOpen(!store.isShortcutsOpen);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        store.zoomBy(1.2);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        store.zoomBy(1 / 1.2);
        return;
      }

      const lower = event.key.toLowerCase();

      if (lower === "f") {
        store.fitView(event.shiftKey ? "width" : "page");
        return;
      }

      if (lower === "b") {
        store.toggleRoomsPanel();
        return;
      }

      const tool = TOOL_KEYS[lower];
      if (tool) {
        if (tool === "edit" && !store.selectedSpaceId) {
          toast("Select a room before editing its shape", "info");
          return;
        }
        store.setMode(tool);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        useEditorStore.getState().setPanKeyDown(false);
      }
    };

    const onBlur = () => useEditorStore.getState().setPanKeyDown(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
