"use client";

import dynamic from "next/dynamic";

export const FloorStage = dynamic(
  () =>
    import("@/features/floor-editor/components/FloorStage").then((mod) => mod.FloorStage),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-600 text-sm text-zinc-200">
        Initializing canvas...
      </div>
    ),
  },
);
