"use client";

import { formatMetersPerPixel, formatZoom } from "@/features/floor-editor/format";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { TOOL_BY_ID } from "@/features/floor-editor/tools";
import { IconButton } from "@/shared/ui/IconButton";
import { FitPageIcon, FitWidthIcon, ZoomInIcon, ZoomOutIcon } from "@/shared/ui/icons";

export function StatusBar() {
  const mode = useEditorStore((state) => state.mode);
  const scale = useEditorStore((state) => state.viewport.scale);
  const floor = useEditorStore((state) => state.floor);
  const draftPolygon = useEditorStore((state) => state.draftPolygon);
  const zoomBy = useEditorStore((state) => state.zoomBy);
  const fitView = useEditorStore((state) => state.fitView);
  const setMode = useEditorStore((state) => state.setMode);

  const tool = TOOL_BY_ID.get(mode);
  const scaleLabel = formatMetersPerPixel(floor?.metersPerPixel ?? null);

  const hint =
    mode === "draw" && draftPolygon.length > 0
      ? `${draftPolygon.length} ${draftPolygon.length === 1 ? "point" : "points"} placed · Enter to finish · Backspace to undo the last one`
      : (tool?.hint ?? "");

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-950 px-3">
      <p className="min-w-0 truncate text-xs text-zinc-500">
        {tool && <span className="mr-2 font-medium text-zinc-300">{tool.label}</span>}
        {hint}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        {scaleLabel ? (
          <span className="mr-1 hidden text-xs text-zinc-500 sm:inline">Scale {scaleLabel}</span>
        ) : (
          <button
            type="button"
            onClick={() => setMode("calibrate")}
            className="mr-1 hidden rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 transition-colors hover:bg-amber-500/20 sm:inline"
          >
            Not calibrated — areas unavailable
          </button>
        )}

        <IconButton
          size="sm"
          tooltipSide="top"
          icon={<ZoomOutIcon className="h-4 w-4" />}
          label="Zoom out"
          shortcut="-"
          onClick={() => zoomBy(1 / 1.2)}
        />
        <button
          type="button"
          onClick={() => fitView("page")}
          title="Reset zoom to fit the page"
          className="min-w-14 rounded-md px-1 py-1 text-center font-mono text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          {formatZoom(scale)}
        </button>
        <IconButton
          size="sm"
          tooltipSide="top"
          icon={<ZoomInIcon className="h-4 w-4" />}
          label="Zoom in"
          shortcut="+"
          onClick={() => zoomBy(1.2)}
        />

        <div className="mx-1 h-5 w-px bg-zinc-800" />

        <IconButton
          size="sm"
          tooltipSide="top"
          icon={<FitPageIcon className="h-4 w-4" />}
          label="Fit page"
          shortcut="F"
          onClick={() => fitView("page")}
        />
        <IconButton
          size="sm"
          tooltipSide="top"
          icon={<FitWidthIcon className="h-4 w-4" />}
          label="Fit width"
          shortcut="⇧F"
          onClick={() => fitView("width")}
        />
      </div>
    </footer>
  );
}
