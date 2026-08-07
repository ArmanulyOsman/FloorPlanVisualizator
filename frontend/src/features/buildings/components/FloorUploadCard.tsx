"use client";

import { useRef, useState } from "react";
import { uploadFloor } from "@/shared/api/floors";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { CloseIcon, UploadIcon } from "@/shared/ui/icons";
import { toast } from "@/shared/ui/toast";
import type { Floor } from "@/shared/types";

type FloorUploadCardProps = {
  buildingId: string;
  suggestedNumber: number;
  onUploaded: (floor: Floor) => void;
};

function formatSize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(Math.round(bytes / 1024), 1)} KB`;
}

export function FloorUploadCard({
  buildingId,
  suggestedNumber,
  onUploaded,
}: FloorUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [floorName, setFloorName] = useState(`Floor ${suggestedNumber}`);
  const [floorNumber, setFloorNumber] = useState(String(suggestedNumber));
  const [pdfPage, setPdfPage] = useState("1");

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) {
      return;
    }
    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
      toast("Only PDF files are supported", "error");
      return;
    }
    setFile(candidate);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast("Choose a PDF floor plan first", "error");
      return;
    }

    const pageIndex = Math.max(Number(pdfPage) - 1, 0);
    const formData = new FormData();
    formData.append("buildingId", buildingId);
    formData.append("name", floorName.trim() || `Floor ${floorNumber}`);
    formData.append("number", floorNumber);
    formData.append("pdfPage", String(pageIndex));
    formData.append("file", file);

    setUploading(true);
    try {
      onUploaded(await uploadFloor(formData));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
      aria-label="Upload floor plan"
    >
      <h2 className="text-sm font-semibold text-zinc-100">Add a floor</h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Each PDF page can become its own floor. Pick the page that holds this floor&apos;s plan.
      </p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        className={`mt-4 rounded-xl border border-dashed p-5 text-center transition-colors ${
          dragging ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 bg-zinc-950/40"
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="truncate font-medium text-zinc-200">{file.name}</span>
            <span className="text-xs text-zinc-500">{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              aria-label="Remove file"
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadIcon className="h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Drop a PDF here or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-blue-400 underline-offset-2 hover:underline"
              >
                browse
              </button>
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Input
          label="Floor name"
          value={floorName}
          onChange={(event) => setFloorName(event.target.value)}
          required
        />
        <Input
          label="Floor number"
          type="number"
          value={floorNumber}
          onChange={(event) => setFloorNumber(event.target.value)}
          required
        />
        <Input
          label="PDF page"
          type="number"
          min="1"
          value={pdfPage}
          hint="1 = first page"
          onChange={(event) => setPdfPage(event.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" variant="primary" loading={uploading} disabled={!file}>
          {uploading ? "Uploading" : "Upload & open editor"}
        </Button>
      </div>
    </form>
  );
}
