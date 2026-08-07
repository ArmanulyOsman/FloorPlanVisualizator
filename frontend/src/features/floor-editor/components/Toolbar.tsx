"use client";

import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { TOOLS } from "@/features/floor-editor/tools";
import { IconButton } from "@/shared/ui/IconButton";
import { HelpIcon, PanelIcon, RedoIcon, UndoIcon } from "@/shared/ui/icons";
import type { EditorMode } from "@/shared/types";

export function Toolbar() {
  const mode = useEditorStore((state) => state.mode);
  const setMode = useEditorStore((state) => state.setMode);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const historyIndex = useEditorStore((state) => state.historyIndex);
  const historyLength = useEditorStore((state) => state.history.length);
  const isRoomsPanelOpen = useEditorStore((state) => state.isRoomsPanelOpen);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const toggleRoomsPanel = useEditorStore((state) => state.toggleRoomsPanel);
  const setShortcutsOpen = useEditorStore((state) => state.setShortcutsOpen);

  const handleModeClick = (nextMode: EditorMode) => {
    setMode(nextMode);
  };

  return (
    <nav
      aria-label="Editor tools"
      className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-950 py-3"
    >
      {TOOLS.map((tool) => {
        const disabled = Boolean(tool.requiresSelection) && !selectedSpaceId;
        return (
          <IconButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            description={disabled ? "Select a room first" : tool.description}
            active={mode === tool.id}
            disabled={disabled}
            onClick={() => handleModeClick(tool.id)}
          />
        );
      })}

      <div className="my-1 h-px w-7 bg-zinc-800" />

      <IconButton
        icon={<UndoIcon className="h-[18px] w-[18px]" />}
        label="Undo"
        shortcut="⌘Z"
        disabled={historyIndex <= 0}
        onClick={undo}
      />
      <IconButton
        icon={<RedoIcon className="h-[18px] w-[18px]" />}
        label="Redo"
        shortcut="⌘⇧Z"
        disabled={historyIndex >= historyLength - 1}
        onClick={redo}
      />

      <div className="mt-auto flex flex-col items-center gap-1">
        <IconButton
          icon={<PanelIcon className="h-[18px] w-[18px]" />}
          label={isRoomsPanelOpen ? "Hide rooms panel" : "Show rooms panel"}
          shortcut="B"
          active={isRoomsPanelOpen}
          onClick={toggleRoomsPanel}
        />
        <IconButton
          icon={<HelpIcon className="h-[18px] w-[18px]" />}
          label="Keyboard shortcuts"
          shortcut="?"
          onClick={() => setShortcutsOpen(true)}
        />
      </div>
    </nav>
  );
}
