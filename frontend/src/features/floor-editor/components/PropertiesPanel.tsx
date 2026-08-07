"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createSpace, deleteSpace, updateSpace } from "@/shared/api/spaces";
import { SPACE_STATUSES, SPACE_TYPES } from "@/features/floor-editor/constants";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { polygonAreaM2 } from "@/lib/polygon-geometry";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import type { SpaceStatus, SpaceType } from "@/shared/types";

type FormValues = {
  number: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  rentableArea: string;
  notes: string;
};

export function PropertiesPanel() {
  const floor = useEditorStore((state) => state.floor);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const spaces = useEditorStore((state) => state.spaces);
  const pendingCreatePolygon = useEditorStore((state) => state.pendingCreatePolygon);
  const updateSpaceLocal = useEditorStore((state) => state.updateSpaceLocal);
  const addSpaceLocal = useEditorStore((state) => state.addSpaceLocal);
  const removeSpaceLocal = useEditorStore((state) => state.removeSpaceLocal);
  const selectSpace = useEditorStore((state) => state.selectSpace);
  const cancelCreate = useEditorStore((state) => state.cancelCreate);
  const pushHistory = useEditorStore((state) => state.pushHistory);
  const setError = useEditorStore((state) => state.setError);
  const setIsSaving = useEditorStore((state) => state.setIsSaving);
  const setMode = useEditorStore((state) => state.setMode);

  const space = spaces.find((item) => item.id === selectedSpaceId) ?? null;
  const isCreate = Boolean(pendingCreatePolygon && floor);
  const geometricPreview =
    isCreate && pendingCreatePolygon && floor
      ? polygonAreaM2(pendingCreatePolygon, pageWidth, pageHeight, floor.metersPerPixel)
      : space?.geometricArea ?? null;

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      number: String(spaces.length + 101),
      name: "New Room",
      type: "Office",
      status: "Available",
      rentableArea: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isCreate) {
      reset({
        number: String(spaces.length + 101),
        name: "New Room",
        type: "Office",
        status: "Available",
        rentableArea: "",
        notes: "",
      });
      return;
    }

    if (!space) {
      return;
    }

    reset({
      number: space.number,
      name: space.name,
      type: space.type,
      status: space.status,
      rentableArea: space.rentableArea?.toString() ?? "",
      notes: space.notes ?? "",
    });
  }, [space, isCreate, spaces.length, reset]);

  // Hide completely when idle — no empty right column.
  if (!isCreate && !space) {
    return null;
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!floor) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreate && pendingCreatePolygon) {
        const created = await createSpace({
          floorId: floor.id,
          number: values.number,
          name: values.name,
          type: values.type,
          status: values.status,
          polygon: pendingCreatePolygon,
          rentableArea: values.rentableArea ? Number(values.rentableArea) : null,
          notes: values.notes || null,
        });
        addSpaceLocal(created);
        pushHistory();
        cancelCreate();
        selectSpace(created.id);
        setMode("select");
      } else if (space) {
        const updated = await updateSpace(space.id, {
          number: values.number,
          name: values.name,
          type: values.type,
          status: values.status,
          rentableArea: values.rentableArea ? Number(values.rentableArea) : null,
          notes: values.notes || null,
        });
        updateSpaceLocal(updated);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save room");
    } finally {
      setIsSaving(false);
    }
  });

  const onDelete = async () => {
    if (!space) {
      return;
    }

    if (!window.confirm(`Delete room ${space.number}?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteSpace(space.id);
      removeSpaceLocal(space.id);
      pushHistory();
      selectSpace(null);
      setMode("view");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete room");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className="absolute right-0 top-0 z-40 flex h-full w-64 flex-col border-l border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur">
      <h2 className="text-sm font-semibold text-zinc-200">
        {isCreate ? "New Room" : "Properties"}
      </h2>
      {isCreate && pendingCreatePolygon && (
        <p className="mt-1 text-xs text-zinc-500">
          Polygon has {pendingCreatePolygon.length} points. Save to add the room.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
        <Input label="Room Number" {...register("number", { required: true })} />
        <Input label="Room Name" {...register("name", { required: true })} />
        <Select label="Type" options={SPACE_TYPES} {...register("type")} />
        <Select label="Status" options={SPACE_STATUSES} {...register("status")} />
        <Input
          label="Geometric Area (m²)"
          value={geometricPreview?.toFixed(2) ?? "—"}
          readOnly
          disabled
        />
        <Input label="Rentable Area (m²)" type="number" step="0.01" {...register("rentableArea")} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Notes</span>
          <textarea
            className="min-h-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-blue-500 focus:ring-2"
            {...register("notes")}
          />
        </label>

        <div className="mt-auto flex gap-2 pt-4">
          <Button type="submit" variant="primary" disabled={formState.isSubmitting}>
            {isCreate ? "Create Room" : "Save"}
          </Button>
          {isCreate ? (
            <Button type="button" variant="ghost" onClick={cancelCreate}>
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </aside>
  );
}
