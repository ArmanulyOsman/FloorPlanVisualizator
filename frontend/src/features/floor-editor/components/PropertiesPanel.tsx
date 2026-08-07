"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { removeSpace } from "@/features/floor-editor/actions";
import {
  SPACE_STATUSES,
  SPACE_TYPE_OPTIONS,
  STATUS_META,
} from "@/features/floor-editor/constants";
import { formatArea } from "@/features/floor-editor/format";
import { useEditorStore } from "@/features/floor-editor/store/editorStore";
import { polygonAreaM2 } from "@/lib/polygon-geometry";
import { createSpace, updateSpace } from "@/shared/api/spaces";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import { CloseIcon, NodesIcon, TargetIcon, TrashIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { toast } from "@/shared/ui/toast";
import type { Space, SpaceStatus, SpaceType } from "@/shared/types";

type FormValues = {
  number: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  rentableArea: string;
  notes: string;
};

function nextRoomNumber(spaces: Space[]): string {
  const numeric = spaces
    .map((space) => Number.parseInt(space.number, 10))
    .filter((value) => Number.isFinite(value));
  return String((numeric.length > 0 ? Math.max(...numeric) : 100) + 1);
}

function toFormValues(space: Space): FormValues {
  return {
    number: space.number,
    name: space.name,
    type: space.type,
    status: space.status,
    rentableArea: space.rentableArea?.toString() ?? "",
    notes: space.notes ?? "",
  };
}

export function PropertiesPanel() {
  const floor = useEditorStore((state) => state.floor);
  const pageWidth = useEditorStore((state) => state.pageWidth);
  const pageHeight = useEditorStore((state) => state.pageHeight);
  const selectedSpaceId = useEditorStore((state) => state.selectedSpaceId);
  const spaces = useEditorStore((state) => state.spaces);
  const pendingCreatePolygon = useEditorStore((state) => state.pendingCreatePolygon);
  const updateSpaceLocal = useEditorStore((state) => state.updateSpaceLocal);
  const addSpaceLocal = useEditorStore((state) => state.addSpaceLocal);
  const selectSpace = useEditorStore((state) => state.selectSpace);
  const cancelCreate = useEditorStore((state) => state.cancelCreate);
  const pushHistory = useEditorStore((state) => state.pushHistory);
  const clearDirty = useEditorStore((state) => state.clearDirty);
  const focusSpace = useEditorStore((state) => state.focusSpace);
  const setMode = useEditorStore((state) => state.setMode);

  const space = spaces.find((item) => item.id === selectedSpaceId) ?? null;
  const isCreate = Boolean(pendingCreatePolygon && floor);
  const polygon = isCreate ? pendingCreatePolygon : (space?.polygon ?? null);

  const geometricArea =
    polygon && floor ? polygonAreaM2(polygon, pageWidth, pageHeight, floor.metersPerPixel) : null;

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      number: "101",
      name: "",
      type: "Office",
      status: "Available",
      rentableArea: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isCreate) {
      reset({
        number: nextRoomNumber(spaces),
        name: "",
        type: "Office",
        status: "Available",
        rentableArea: "",
        notes: "",
      });
      return;
    }

    if (space) {
      reset(toFormValues(space));
    }
    // `spaces` is intentionally excluded: re-running on every polygon drag would discard typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id, isCreate, reset]);

  if (!isCreate && !space) {
    return null;
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!floor) {
      return;
    }

    const payload = {
      number: values.number.trim(),
      name: values.name.trim(),
      type: values.type,
      status: values.status,
      rentableArea: values.rentableArea ? Number(values.rentableArea) : null,
      notes: values.notes.trim() || null,
    };

    try {
      if (isCreate && pendingCreatePolygon) {
        const created = await createSpace({
          floorId: floor.id,
          polygon: pendingCreatePolygon,
          ...payload,
        });
        addSpaceLocal(created);
        pushHistory();
        cancelCreate();
        selectSpace(created.id);
        setMode("select");
        toast(`Room ${created.number} created`, "success");
      } else if (space) {
        const updated = await updateSpace(space.id, { ...payload, polygon: space.polygon });
        updateSpaceLocal(updated);
        clearDirty(updated.id);
        pushHistory();
        reset(toFormValues(updated));
        toast("Room saved", "success");
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to save room", "error");
    }
  });

  const onClose = () => {
    if (isCreate) {
      cancelCreate();
      return;
    }
    selectSpace(null);
  };

  const statusMeta = space ? STATUS_META[space.status] : STATUS_META.Available;

  return (
    <aside className="animate-panel-in absolute right-0 top-0 z-40 flex h-full w-72 flex-col border-l border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur">
      <header className="flex items-start justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusMeta.dot}`} />
            <span className="truncate">
              {isCreate ? "New room" : `${space?.number} · ${space?.name || "Untitled"}`}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {isCreate
              ? `${pendingCreatePolygon?.length ?? 0} corners traced`
              : `${space?.polygon.length ?? 0} corners`}
            {formState.isDirty && <span className="ml-1.5 text-amber-400">· unsaved</span>}
          </p>
        </div>
        <IconButton
          size="sm"
          tooltipSide="left"
          icon={<CloseIcon className="h-4 w-4" />}
          label={isCreate ? "Discard room" : "Close"}
          shortcut="Esc"
          onClick={onClose}
        />
      </header>

      {space && (
        <div className="flex gap-1.5 border-b border-zinc-800 px-4 py-2.5">
          <Button
            size="sm"
            variant="subtle"
            icon={<TargetIcon className="h-3.5 w-3.5" />}
            onClick={() => focusSpace(space.id)}
          >
            Zoom to
          </Button>
          <Button
            size="sm"
            variant="subtle"
            icon={<NodesIcon className="h-3.5 w-3.5" />}
            onClick={() => setMode("edit")}
          >
            Edit shape
          </Button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Number"
              autoFocus={isCreate}
              error={formState.errors.number ? "Required" : undefined}
              {...register("number", { required: true })}
            />
            <Input label="Name" placeholder="Office A" {...register("name")} />
          </div>

          <Select label="Type" options={SPACE_TYPE_OPTIONS} {...register("type")} />
          <Select label="Status" options={SPACE_STATUSES} {...register("status")} />

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Geometric area</span>
              <span className="font-medium text-zinc-200">
                {formatArea(geometricArea) ?? "Needs calibration"}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-zinc-600">
              Calculated from the polygon and the floor scale.
            </p>
          </div>

          <Input
            label="Rentable area"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            suffix="m²"
            {...register("rentableArea")}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</span>
            <textarea
              rows={3}
              placeholder="Anything worth remembering about this room"
              className="scrollbar-thin resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              {...register("notes")}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={formState.isSubmitting}
            disabled={!isCreate && !formState.isDirty}
          >
            {isCreate ? "Create room" : formState.isDirty ? "Save changes" : "Saved"}
          </Button>
          {isCreate ? (
            <Button variant="ghost" onClick={cancelCreate}>
              Discard
            </Button>
          ) : (
            space && (
              <IconButton
                tooltipSide="top"
                icon={<TrashIcon className="h-4 w-4" />}
                label="Delete room"
                shortcut="Del"
                className="text-red-400 hover:bg-red-950 hover:text-red-300"
                onClick={() => void removeSpace(space.id)}
              />
            )
          )}
        </div>
      </form>
    </aside>
  );
}
