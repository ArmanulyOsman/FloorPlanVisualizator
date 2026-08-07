import { apiFetch, getApiUrl } from "@/shared/api/client";
import type { Floor, FloorSummary } from "@/shared/types";

export function getFloor(id: string): Promise<Floor> {
  return apiFetch<Floor>(`/api/floors/${id}`);
}

export function getFloorsByBuilding(buildingId: string): Promise<FloorSummary[]> {
  return apiFetch<FloorSummary[]>(`/api/floors?buildingId=${buildingId}`);
}

export function uploadFloor(formData: FormData): Promise<Floor> {
  return apiFetch<Floor>("/api/floors", {
    method: "POST",
    body: formData,
  });
}

export function updateFloor(
  id: string,
  payload: {
    name?: string;
    number?: number;
    metersPerPixel?: number;
    width?: number;
    height?: number;
  },
): Promise<Floor> {
  return apiFetch<Floor>(`/api/floors/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteFloor(id: string): Promise<void> {
  return apiFetch<void>(`/api/floors/${id}`, { method: "DELETE" });
}

export function getFloorPdfUrl(pdfUrl: string): string {
  if (pdfUrl.startsWith("http")) {
    return pdfUrl;
  }
  return getApiUrl(pdfUrl);
}

export function getFloorPreviewUrl(floorId: string, version?: string): string {
  const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
  return getApiUrl(`/api/files/${floorId}/preview${suffix}`);
}
