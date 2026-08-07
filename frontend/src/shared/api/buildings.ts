import { apiFetch } from "@/shared/api/client";
import type { Building } from "@/shared/types";

export function getBuildings(): Promise<Building[]> {
  return apiFetch<Building[]>("/api/buildings");
}

export function getBuilding(id: string): Promise<Building> {
  return apiFetch<Building>(`/api/buildings/${id}`);
}

export function createBuilding(payload: { name: string; address?: string }): Promise<Building> {
  return apiFetch<Building>("/api/buildings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
