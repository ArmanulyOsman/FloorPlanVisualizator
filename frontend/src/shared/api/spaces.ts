import { apiFetch } from "@/shared/api/client";
import type { CreateSpacePayload, Space, UpdateSpacePayload } from "@/shared/types";

export function getSpace(id: string): Promise<Space> {
  return apiFetch<Space>(`/api/spaces/${id}`);
}

export function createSpace(payload: CreateSpacePayload): Promise<Space> {
  return apiFetch<Space>("/api/spaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateSpace(id: string, payload: UpdateSpacePayload): Promise<Space> {
  return apiFetch<Space>(`/api/spaces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteSpace(id: string): Promise<void> {
  return apiFetch<void>(`/api/spaces/${id}`, { method: "DELETE" });
}
