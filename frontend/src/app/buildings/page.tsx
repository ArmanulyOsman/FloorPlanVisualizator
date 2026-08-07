"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBuilding, getBuildings } from "@/shared/api/buildings";
import { AppShell } from "@/shared/ui/AppShell";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { BuildingIcon, PlusIcon, SpinnerIcon } from "@/shared/ui/icons";
import { toast } from "@/shared/ui/toast";
import type { Building } from "@/shared/types";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getBuildings()
      .then(setBuildings)
      .catch((err: Error) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setCreating(true);

    try {
      const created = await createBuilding({ name: trimmed, address: address.trim() || undefined });
      setName("");
      setAddress("");
      toast(`${created.name} created`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create building", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buildings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Upload floor plans and digitize rooms for each property.
          </p>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Input
          label="Building name"
          placeholder="Nurly Tau Business Center"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Input
          label="Address"
          placeholder="Al-Farabi Ave 7"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <Button
          type="submit"
          variant="primary"
          loading={creating}
          disabled={!name.trim()}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add building
        </Button>
      </form>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <SpinnerIcon className="h-4 w-4" />
            Loading buildings...
          </div>
        ) : buildings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <BuildingIcon className="h-8 w-8 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-300">No buildings yet</p>
            <p className="max-w-xs text-xs text-zinc-500">
              Create your first building above, then upload a floor plan PDF to start drawing rooms.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {buildings.map((building) => {
              const floorCount = building.floors?.length ?? 0;
              return (
                <li key={building.id}>
                  <Link
                    href={`/buildings/${building.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <p className="font-medium text-zinc-100 group-hover:text-white">
                      {building.name}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {building.address || "No address"}
                    </p>
                    <p className="mt-3 text-xs text-zinc-500">
                      {floorCount} {floorCount === 1 ? "floor" : "floors"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
