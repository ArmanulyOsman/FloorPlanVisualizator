"use client";

import { useParams } from "next/navigation";
import { FloorEditor } from "@/features/floor-editor/components/FloorEditor";

export default function FloorEditPage() {
  const params = useParams<{ id: string }>();
  const floorId = params.id;

  if (!floorId) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading editor...
      </div>
    );
  }

  return <FloorEditor floorId={floorId} />;
}
