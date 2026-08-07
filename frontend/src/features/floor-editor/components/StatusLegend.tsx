"use client";

import { SPACE_STATUSES, STATUS_META } from "@/features/floor-editor/constants";

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-zinc-800 px-3 py-2.5">
      {SPACE_STATUSES.map((status) => (
        <span key={status} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
          {STATUS_META[status].label}
        </span>
      ))}
    </div>
  );
}
