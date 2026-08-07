"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getBuilding } from "@/shared/api/buildings";
import { deleteFloor, uploadFloor } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { Building } from "@/shared/types";

export default function BuildingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const buildingId = params.id;

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [floorName, setFloorName] = useState("Floor 1");
  const [floorNumber, setFloorNumber] = useState("1");
  const [pdfPage, setPdfPage] = useState("0");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getBuilding(buildingId)
      .then(setBuilding)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Select a PDF file");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("buildingId", buildingId);
    formData.append("name", floorName);
    formData.append("number", floorNumber);
    formData.append("pdfPage", pdfPage);
    formData.append("file", file);

    try {
      const floor = await uploadFloor(formData);
      router.push(`/floors/${floor.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDeleteFloor = async (floorId: string, name: string) => {
    if (!window.confirm(`Delete floor "${name}"?`)) {
      return;
    }

    try {
      await deleteFloor(floorId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">Loading...</div>;
  }

  if (!building) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 text-red-300">
        <p>{error ?? "Building not found"}</p>
        <Link href="/buildings" className="text-blue-400 hover:underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/buildings" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← All buildings
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">{building.name}</h1>
        {building.address && <p className="text-sm text-zinc-500">{building.address}</p>}

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-medium">Upload floor PDF</h2>
          <form onSubmit={onUpload} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Floor name" value={floorName} onChange={(e) => setFloorName(e.target.value)} required />
            <Input
              label="Floor number"
              type="number"
              min="1"
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              required
            />
            <Input
              label="PDF page index (0-based)"
              type="number"
              min="0"
              value={pdfPage}
              onChange={(e) => setPdfPage(e.target.value)}
            />
            <label className="flex flex-col gap-1.5 text-sm md:col-span-2">
              <span className="text-zinc-400">PDF file</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                required
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" variant="primary" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload & Open Editor"}
              </Button>
            </div>
          </form>
        </section>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <section className="mt-8">
          <h2 className="text-lg font-medium">Floors</h2>
          {building.floors.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No floors uploaded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-800 overflow-hidden rounded-2xl border border-zinc-800">
              {building.floors.map((floor) => (
                <li key={floor.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium">
                      {floor.name} <span className="text-zinc-500">#{floor.number}</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {Math.round(floor.width)}×{Math.round(floor.height)} px
                      {floor.metersPerPixel ? ` · calibrated` : " · not calibrated"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/floors/${floor.id}/edit`}>
                      <Button variant="primary">Edit</Button>
                    </Link>
                    <Button variant="danger" onClick={() => onDeleteFloor(floor.id, floor.name)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
