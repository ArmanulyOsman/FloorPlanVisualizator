"use client";

import { useEffect, useRef, useState } from "react";
import { getFloorPreviewUrl, updateFloor } from "@/shared/api/floors";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import type { Floor } from "@/shared/types";

/**
 * Loads backend PNG preview once per floor and syncs page size from natural pixels.
 * Avoids reload loops when PATCH updates floor.updatedAt.
 */
export function useFloorPreview(floor: Floor | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const setPageSize = useEditorStore((state) => state.setPageSize);
  const updateFloorMeta = useEditorStore((state) => state.updateFloorMeta);

  const floorId = floor?.id ?? null;
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!floorId) {
      setImageUrl(null);
      setReady(false);
      setLoading(false);
      syncedRef.current = null;
      return;
    }

    const nextUrl = getFloorPreviewUrl(floorId);
    setError(null);

    setImageUrl((prev) => {
      // Same URL (e.g. React Strict Mode remount) — do not hide or reload.
      if (prev === nextUrl) {
        return prev;
      }
      syncedRef.current = null;
      setLoading(true);
      setReady(false);
      return nextUrl;
    });
  }, [floorId]);

  const onImageLoad = (img: HTMLImageElement) => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (width <= 0 || height <= 0) {
      setError("Invalid preview image");
      setLoading(false);
      setReady(false);
      return;
    }

    setPageSize(width, height);
    setReady(true);
    setLoading(false);

    const current = useEditorStore.getState().floor;
    if (!current || syncedRef.current === current.id) {
      return;
    }

    syncedRef.current = current.id;

    if (Math.round(current.width) === width && Math.round(current.height) === height) {
      return;
    }

    updateFloor(current.id, { width, height })
      .then((updated) => {
        // Do not let server dimensions override the preview pixel size.
        updateFloorMeta({
          name: updated.name,
          number: updated.number,
          metersPerPixel: updated.metersPerPixel,
          pdfUrl: updated.pdfUrl,
          pdfPage: updated.pdfPage,
          updatedAt: updated.updatedAt,
          width,
          height,
        });
        setPageSize(width, height);
      })
      .catch((err) => console.error("Failed to sync floor dimensions", err));
  };

  const onImageError = () => {
    setReady(false);
    setLoading(false);
    setError("Failed to load floor plan preview. Is backend running?");
  };

  return { imageUrl, loading, error, ready, onImageLoad, onImageError };
}
