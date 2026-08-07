"use client";

import Link from "next/link";
import { getFloorPreviewUrl } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { TrashIcon } from "@/shared/ui/icons";
import type { FloorSummary } from "@/shared/types";

type FloorListProps = {
  floors: FloorSummary[];
  onDelete: (floor: FloorSummary) => void;
};

export function FloorList({ floors, onDelete }: FloorListProps) {
  if (floors.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
        No floors yet. Upload a PDF above to create the first one.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {[...floors]
        .sort((a, b) => a.number - b.number)
        .map((floor) => (
          <li
            key={floor.id}
            className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700"
          >
            <Link
              href={`/floors/${floor.id}/edit`}
              className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFloorPreviewUrl(floor.id)}
                alt={`${floor.name} preview`}
                loading="lazy"
                className="h-full w-full object-cover object-top"
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/floors/${floor.id}/edit`} className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{floor.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Floor {floor.number} · page {floor.pdfPage + 1} ·{" "}
                  {Math.round(floor.width)}×{Math.round(floor.height)} px
                </p>
              </Link>

              <div className="mt-1.5">
                {floor.metersPerPixel ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                    Calibrated
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                    Needs scale
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                <Link href={`/floors/${floor.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    Open editor
                  </Button>
                </Link>
                <IconButton
                  size="sm"
                  tooltipSide="left"
                  icon={<TrashIcon className="h-4 w-4" />}
                  label="Delete floor"
                  className="hover:bg-red-950 hover:text-red-300"
                  onClick={() => onDelete(floor)}
                />
              </div>
            </div>
          </li>
        ))}
    </ul>
  );
}
