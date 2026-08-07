"use client";

import type { Viewport } from "@/shared/types";

type PdfPreviewProps = {
  imageUrl: string;
  pageWidth: number;
  pageHeight: number;
  viewport: Viewport;
  ready: boolean;
  onImageLoad: (image: HTMLImageElement) => void;
  onImageError: () => void;
};

export function PdfPreview({
  imageUrl,
  pageWidth,
  pageHeight,
  viewport,
  ready,
  onImageLoad,
  onImageError,
}: PdfPreviewProps) {
  const sized = pageWidth > 1 && pageHeight > 1;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 origin-top-left will-change-transform"
      style={{
        width: sized ? pageWidth : "auto",
        height: sized ? pageHeight : "auto",
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Floor plan"
        draggable={false}
        className="block max-w-none select-none bg-white shadow-2xl ring-1 ring-black/20"
        style={sized ? { width: pageWidth, height: pageHeight } : { maxWidth: "100%" }}
        onLoad={(event) => onImageLoad(event.currentTarget)}
        onError={onImageError}
        ref={(node) => {
          // Cached images can finish loading before onLoad is attached.
          if (node?.complete && node.naturalWidth > 0 && !ready) {
            onImageLoad(node);
          }
        }}
      />
    </div>
  );
}
