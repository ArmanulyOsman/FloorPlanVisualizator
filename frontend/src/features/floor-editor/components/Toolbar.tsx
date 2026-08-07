"use client";

import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { Button } from "@/shared/ui/Button";
import type { EditorMode } from "@/shared/types";

const MODES: { id: EditorMode; label: string; hint: string }[] = [
  { id: "view", label: "View", hint: "Pan/zoom · click room to select" },
  { id: "select", label: "Select", hint: "Click room to inspect metadata" },
  { id: "draw", label: "Draw", hint: "Click points · Enter finish · Esc cancel" },
  { id: "edit", label: "Edit", hint: "Drag vertices · dbl-click edge · right-click delete" },
  { id: "calibrate", label: "Scale", hint: "Pick 2 points, set real distance" },
];

type ToolbarProps = {
  onFitWidth: () => void;
  onFitPage: () => void;
  onSave: () => void;
};

export function Toolbar({ onFitWidth, onFitPage, onSave }: ToolbarProps) {
  const mode = useEditorStore((state) => state.mode);
  const setMode = useEditorStore((state) => state.setMode);
  const floor = useEditorStore((state) => state.floor);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const isSaving = useEditorStore((state) => state.isSaving);
  const dirtyCount = useEditorStore((state) => state.dirtySpaceIds.size);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  const activeHint = MODES.find((item) => item.id === mode)?.hint ?? "";

  const handleModeClick = (nextMode: EditorMode) => {
    if (nextMode === "edit" && !selectedSpaceId) {
      return;
    }
    setMode(nextMode);
  };

  return (
    <div className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-zinc-800 bg-zinc-950 py-4">
      {MODES.map((item) => {
        const disabled = item.id === "edit" && !selectedSpaceId;
        return (
          <button
            key={item.id}
            type="button"
            title={item.hint}
            disabled={disabled}
            onClick={() => handleModeClick(item.id)}
            className={`flex h-10 w-12 items-center justify-center rounded-xl text-[10px] font-semibold transition ${
              mode === item.id
                ? "bg-blue-600 text-white"
                : disabled
                  ? "cursor-not-allowed bg-zinc-900/50 text-zinc-600"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            {item.label.slice(0, 1)}
          </button>
        );
      })}

      <div className="mt-2 flex flex-col gap-1 px-2">
        <Button variant="ghost" className="w-full px-1 text-[10px]" onClick={undo}>
          Undo
        </Button>
        <Button variant="ghost" className="w-full px-1 text-[10px]" onClick={redo}>
          Redo
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2 px-2">
        <Button variant="ghost" className="w-full px-1 text-[10px]" onClick={onFitWidth}>
          Fit W
        </Button>
        <Button variant="ghost" className="w-full px-1 text-[10px]" onClick={onFitPage}>
          Fit P
        </Button>
        <Button
          variant="primary"
          className="w-full px-1 text-[10px]"
          onClick={onSave}
          disabled={isSaving || dirtyCount === 0}
        >
          Save{dirtyCount > 0 ? ` (${dirtyCount})` : ""}
        </Button>
      </div>

      {floor && (
        <div className="px-2 text-center text-[10px] leading-tight text-zinc-500">
          {floor.name}
        </div>
      )}

      <div className="px-2 text-center text-[10px] leading-tight text-zinc-500">{activeHint}</div>
    </div>
  );
}
