"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBuilding, getBuildings } from "@/shared/api/buildings";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { Building } from "@/shared/types";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getBuildings()
      .then(setBuildings)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createBuilding({ name: name.trim(), address: address.trim() || undefined });
      setName("");
      setAddress("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create building");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Buildings</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage buildings and upload floor plans.</p>

        <form onSubmit={onCreate} className="mt-8 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Input label="Building name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Button type="submit" variant="primary" disabled={creating}>
            Create
          </Button>
        </form>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-8">
          {loading ? (
            <p className="text-zinc-500">Loading...</p>
          ) : buildings.length === 0 ? (
            <p className="text-zinc-500">No buildings yet. Create one above.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800">
              {buildings.map((building) => (
                <li key={building.id}>
                  <Link
                    href={`/buildings/${building.id}`}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-zinc-900"
                  >
                    <div>
                      <p className="font-medium">{building.name}</p>
                      {building.address && <p className="text-sm text-zinc-500">{building.address}</p>}
                    </div>
                    <span className="text-sm text-blue-400">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
