import type { ReactNode } from "react";
import { CursorIcon, HandIcon, NodesIcon, PenIcon, RulerIcon } from "@/shared/ui/icons";
import type { EditorMode } from "@/shared/types";

export type ToolDefinition = {
  id: EditorMode;
  label: string;
  shortcut: string;
  description: string;
  /** Shown in the status bar while the tool is active. */
  hint: string;
  icon: ReactNode;
  requiresSelection?: boolean;
};

export const TOOLS: ToolDefinition[] = [
  {
    id: "view",
    label: "Pan",
    shortcut: "V",
    description: "Move around the plan",
    hint: "Drag to pan · scroll to zoom · click a room to select it",
    icon: <HandIcon className="h-[18px] w-[18px]" />,
  },
  {
    id: "select",
    label: "Select",
    shortcut: "S",
    description: "Inspect and edit room details",
    hint: "Click a room to open its properties · drag empty space to pan",
    icon: <CursorIcon className="h-[18px] w-[18px]" />,
  },
  {
    id: "draw",
    label: "Draw room",
    shortcut: "D",
    description: "Trace a new room polygon",
    hint: "Click each corner · Enter or click the first point to finish · Esc to cancel",
    icon: <PenIcon className="h-[18px] w-[18px]" />,
  },
  {
    id: "edit",
    label: "Edit shape",
    shortcut: "E",
    description: "Reshape the selected room",
    hint: "Drag handles to move corners · double-click an edge to add one · right-click to remove",
    icon: <NodesIcon className="h-[18px] w-[18px]" />,
    requiresSelection: true,
  },
  {
    id: "calibrate",
    label: "Set scale",
    shortcut: "C",
    description: "Calibrate meters per pixel",
    hint: "Click two points a known distance apart, then enter that distance",
    icon: <RulerIcon className="h-[18px] w-[18px]" />,
  },
];

export const TOOL_BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

export const SHORTCUT_GROUPS: { title: string; items: { keys: string[]; action: string }[] }[] = [
  {
    title: "Tools",
    items: [
      { keys: ["V"], action: "Pan tool" },
      { keys: ["S"], action: "Select tool" },
      { keys: ["D"], action: "Draw room" },
      { keys: ["E"], action: "Edit shape of selected room" },
      { keys: ["C"], action: "Set scale" },
      { keys: ["Space", "drag"], action: "Temporarily pan in any tool" },
    ],
  },
  {
    title: "Drawing",
    items: [
      { keys: ["Click"], action: "Add a corner" },
      { keys: ["Enter"], action: "Finish the polygon" },
      { keys: ["Backspace"], action: "Remove the last corner" },
      { keys: ["Esc"], action: "Cancel drawing or clear the selection" },
    ],
  },
  {
    title: "View",
    items: [
      { keys: ["Scroll"], action: "Zoom in and out" },
      { keys: ["+"], action: "Zoom in" },
      { keys: ["-"], action: "Zoom out" },
      { keys: ["F"], action: "Fit whole page" },
      { keys: ["Shift", "F"], action: "Fit page width" },
      { keys: ["B"], action: "Toggle the rooms panel" },
    ],
  },
  {
    title: "Editing",
    items: [
      { keys: ["⌘/Ctrl", "Z"], action: "Undo" },
      { keys: ["⌘/Ctrl", "Shift", "Z"], action: "Redo" },
      { keys: ["⌘/Ctrl", "S"], action: "Save pending changes" },
      { keys: ["Delete"], action: "Delete the selected room" },
      { keys: ["?"], action: "Show this help" },
    ],
  },
];
