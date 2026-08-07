"use client";

import dynamic from "next/dynamic";

export const FloorStage = dynamic(
  () => import("@/features/floor-editor/components/FloorStage").then((mod) => mod.FloorStage),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-sm text-zinc-400">
        Initializing canvas...
      </div>
    ),
  },
);
