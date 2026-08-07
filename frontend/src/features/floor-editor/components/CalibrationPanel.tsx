"use client";

import { useState } from "react";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { denormalizePoint } from "@/lib/coordinates";
import { updateFloor } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { RulerIcon } from "@/shared/ui/icons";
import { toast } from "@/shared/ui/toast";

export function CalibrationPanel() {
  const floor = useEditorStore((state) => state.floor);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const calibratePoints = useEditorStore((state) => state.calibratePoints);
  const clearCalibrate = useEditorStore((state) => state.clearCalibrate);
  const setFloor = useEditorStore((state) => state.setFloor);
  const setMode = useEditorStore((state) => state.setMode);

  const [distance, setDistance] = useState("10");
  const [applying, setApplying] = useState(false);

  const pixelDistance =
    calibratePoints.length === 2
      ? (() => {
          const a = denormalizePoint(calibratePoints[0], pageWidth, pageHeight);
          const b = denormalizePoint(calibratePoints[1], pageWidth, pageHeight);
          return Math.hypot(a.x - b.x, a.y - b.y);
        })()
      : 0;

  const meters = Number(distance);
  const canApply = calibratePoints.length === 2 && pixelDistance > 0 && meters > 0 && !applying;

  const apply = async () => {
    if (!floor || !canApply) {
      return;
    }

    setApplying(true);
    try {
      const updated = await updateFloor(floor.id, { metersPerPixel: meters / pixelDistance });
      setFloor(updated);
      clearCalibrate();
      setMode("select");
      toast("Scale saved — areas are now calculated", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Calibration failed", "error");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-30 w-[22rem] -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2">
        <RulerIcon className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-zinc-100">Set floor scale</h3>
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
        {calibratePoints.length === 0
          ? "Click the start of a wall or dimension line you know the real length of."
          : calibratePoints.length === 1
            ? "Now click the end of that same segment."
            : `Segment measured: ${pixelDistance.toFixed(0)} px. Enter its real length.`}
      </p>

      <div className="mt-3 flex items-end gap-2">
        <Input
          label="Real distance"
          type="number"
          step="0.01"
          min="0"
          suffix="m"
          value={distance}
          disabled={calibratePoints.length !== 2}
          onChange={(event) => setDistance(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void apply();
            }
          }}
        />
        <Button variant="primary" loading={applying} disabled={!canApply} onClick={() => void apply()}>
          Apply
        </Button>
        <Button variant="ghost" onClick={clearCalibrate} disabled={calibratePoints.length === 0}>
          Reset
        </Button>
      </div>

      {canApply && (
        <p className="mt-2 text-[11px] text-zinc-500">
          Resulting scale: {(pixelDistance / meters).toFixed(1)} px per meter
        </p>
      )}
    </div>
  );
}
