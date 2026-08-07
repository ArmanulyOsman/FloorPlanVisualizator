"use client";

import { useEffect, useRef, useState } from "react";
import { getFloorPdfUrl, updateFloor } from "@/shared/api/floors";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { renderPdfPageToCanvas } from "@/lib/pdf";
import type { Floor } from "@/shared/types";

export function usePdfTexture(floor: Floor | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncedIdRef = useRef<string | null>(null);

  const setPageSize = useEditorStore((state) => state.setPageSize);
  const updateFloorMeta = useEditorStore((state) => state.updateFloorMeta);

  const floorId = floor?.id ?? null;
  const pdfUrl = floor?.pdfUrl ?? null;
  const pdfPage = floor?.pdfPage ?? 0;

  useEffect(() => {
    if (!floorId || !pdfUrl) {
      setImage(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setImage(null);

    const url = getFloorPdfUrl(pdfUrl);

    renderPdfPageToCanvas(url, pdfPage, 2)
      .then(({ canvas, pageWidth, pageHeight }) => {
        if (cancelled) {
          return;
        }

        setPageSize(pageWidth, pageHeight);

        const roundedWidth = Math.round(pageWidth);
        const roundedHeight = Math.round(pageHeight);
        const currentFloor = useEditorStore.getState().floor;

        if (
          currentFloor &&
          syncedIdRef.current !== currentFloor.id &&
          (Math.round(currentFloor.width) !== roundedWidth ||
            Math.round(currentFloor.height) !== roundedHeight)
        ) {
          syncedIdRef.current = currentFloor.id;
          updateFloor(currentFloor.id, { width: roundedWidth, height: roundedHeight })
            .then((updated) => {
              if (!cancelled) {
                updateFloorMeta(updated);
              }
            })
            .catch((err) => {
              console.error("Failed to sync floor dimensions", err);
            });
        }

        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            setImage(img);
            setLoading(false);
          }
        };
        img.onerror = () => {
          if (!cancelled) {
            setError("Failed to decode PDF texture");
            setLoading(false);
          }
        };
        img.src = canvas.toDataURL("image/png");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [floorId, pdfUrl, pdfPage, setPageSize, updateFloorMeta]);

  return { image, loading, error };
}
