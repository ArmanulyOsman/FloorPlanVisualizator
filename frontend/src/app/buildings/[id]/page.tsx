"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FloorList } from "@/features/buildings/components/FloorList";
import { FloorUploadCard } from "@/features/buildings/components/FloorUploadCard";
import { getBuilding } from "@/shared/api/buildings";
import { deleteFloor } from "@/shared/api/floors";
import { AppShell } from "@/shared/ui/AppShell";
import { Button } from "@/shared/ui/Button";
import { ArrowLeftIcon, SpinnerIcon } from "@/shared/ui/icons";
import { toast } from "@/shared/ui/toast";
import type { Building, FloorSummary } from "@/shared/types";

export default function BuildingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const buildingId = params.id;

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getBuilding(buildingId)
      .then(setBuilding)
      .catch((err: Error) => {
        setNotFound(true);
        toast(err.message, "error");
      })
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(load, [load]);

  const onDeleteFloor = async (floor: FloorSummary) => {
    if (!window.confirm(`Delete "${floor.name}" and all of its rooms?`)) {
      return;
    }

    try {
      await deleteFloor(floor.id);
      toast(`${floor.name} deleted`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-zinc-500">
          <SpinnerIcon className="h-4 w-4" />
          Loading building...
        </div>
      </AppShell>
    );
  }

  if (!building || notFound) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-zinc-300">This building could not be loaded.</p>
          <Link href="/buildings">
            <Button variant="secondary" icon={<ArrowLeftIcon className="h-4 w-4" />}>
              All buildings
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const nextFloorNumber =
    building.floors.length > 0 ? Math.max(...building.floors.map((floor) => floor.number)) + 1 : 1;

  return (
    <AppShell>
      <Link
        href="/buildings"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All buildings
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{building.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">{building.address || "No address"}</p>

      <section className="mt-6">
        <FloorUploadCard
          buildingId={buildingId}
          suggestedNumber={nextFloorNumber}
          onUploaded={(floor) => router.push(`/floors/${floor.id}/edit`)}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">
          Floors <span className="ml-1 font-normal text-zinc-500">{building.floors.length}</span>
        </h2>
        <FloorList floors={building.floors} onDelete={onDeleteFloor} />
      </section>
    </AppShell>
  );
}
