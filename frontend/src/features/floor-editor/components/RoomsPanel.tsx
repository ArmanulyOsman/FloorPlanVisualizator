"use client";

import { useMemo, useState } from "react";
import { SPACE_STATUSES, SPACE_TYPE_LABELS, STATUS_META } from "@/features/floor-editor/constants";
import { formatArea } from "@/features/floor-editor/format";
import { StatusLegend } from "@/features/floor-editor/components/StatusLegend";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { Button } from "@/shared/ui/Button";
import { PenIcon, SearchIcon } from "@/shared/ui/icons";
import { inputClasses } from "@/shared/ui/Input";
import type { Space, SpaceStatus } from "@/shared/types";

type StatusFilter = SpaceStatus | "All";

const FILTERS: StatusFilter[] = ["All", ...SPACE_STATUSES];

function matchesQuery(space: Space, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    space.number.toLowerCase().includes(needle) ||
    space.name.toLowerCase().includes(needle) ||
    SPACE_TYPE_LABELS[space.type].toLowerCase().includes(needle)
  );
}

export function RoomsPanel() {
  const spaces = useEditorStore((state) => state.spaces);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const dirtySpaceIds = useEditorStore((state) => state.dirtySpaceIds);
  const selectSpace = useEditorStore((state) => state.selectSpace);
  const hoverSpace = useEditorStore((state) => state.hoverSpace);
  const ensureSpaceVisible = useEditorStore((state) => state.ensureSpaceVisible);
  const setMode = useEditorStore((state) => state.setMode);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const visibleSpaces = useMemo(() => {
    return spaces
      .filter((space) => statusFilter === "All" || space.status === statusFilter)
      .filter((space) => matchesQuery(space, query))
      .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [spaces, statusFilter, query]);

  const handleSelect = (spaceId: string) => {
    selectSpace(spaceId);
    setMode("select");
    ensureSpaceVisible(spaceId);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <h2 className="text-sm font-semibold text-zinc-100">
          Rooms <span className="ml-1 text-xs font-normal text-zinc-500">{spaces.length}</span>
        </h2>
        <Button
          size="sm"
          variant="subtle"
          icon={<PenIcon className="h-3.5 w-3.5" />}
          onClick={() => setMode("draw")}
        >
          Draw
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-600" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search number or name"
            className={`${inputClasses} py-1.5 pl-8 text-xs`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {FILTERS.map((filter) => {
          const count =
            filter === "All"
              ? spaces.length
              : spaces.filter((space) => space.status === filter).length;

          if (filter !== "All" && count === 0) {
            return null;
          }

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                statusFilter === filter
                  ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {filter === "All" ? "All" : STATUS_META[filter].label} {count}
            </button>
          );
        })}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {spaces.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-zinc-500">
            No rooms yet.
            <br />
            Press <kbd className="rounded border border-zinc-700 px-1">D</kbd> and trace a room on
            the plan.
          </p>
        ) : visibleSpaces.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-500">No rooms match this filter.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {visibleSpaces.map((space) => {
              const isSelected = space.id === selectedSpaceId;
              const area = formatArea(space.rentableArea ?? space.geometricArea);

              return (
                <li key={space.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(space.id)}
                    onMouseEnter={() => hoverSpace(space.id)}
                    onMouseLeave={() => hoverSpace(null)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      isSelected ? "bg-blue-600/20 ring-1 ring-blue-500/40" : "hover:bg-zinc-900"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[space.status].dot}`}
                      title={STATUS_META[space.status].label}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-zinc-100">
                          {space.number}
                        </span>
                        <span className="truncate text-xs text-zinc-400">{space.name}</span>
                        {dirtySpaceIds.has(space.id) && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                            title="Unsaved changes"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 flex gap-2 text-[11px] text-zinc-500">
                        <span className="truncate">{SPACE_TYPE_LABELS[space.type]}</span>
                        {area && <span className="shrink-0">{area}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <StatusLegend />
    </aside>
  );
}
