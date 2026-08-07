import type { SpaceStatus, SpaceType } from "@/shared/types";

export const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  Available: { fill: "rgba(34, 197, 94, 0.32)", stroke: "#22c55e" },
  Occupied: { fill: "rgba(239, 68, 68, 0.32)", stroke: "#ef4444" },
  Reserved: { fill: "rgba(249, 115, 22, 0.32)", stroke: "#f97316" },
  Maintenance: { fill: "rgba(156, 163, 175, 0.32)", stroke: "#9ca3af" },
  Hidden: { fill: "rgba(107, 114, 128, 0.16)", stroke: "#6b7280" },
};

export const SELECTED_COLOR = { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3b82f6" };
export const DRAWING_COLOR = { fill: "rgba(59, 130, 246, 0.2)", stroke: "#60a5fa" };

export const SPACE_TYPES = [
  "Office",
  "Retail",
  "Warehouse",
  "Technical",
  "Parking",
  "CommonArea",
  "MeetingRoom",
  "Corridor",
  "Toilet",
  "Other",
] as const;

export const SPACE_STATUSES = [
  "Available",
  "Occupied",
  "Reserved",
  "Maintenance",
  "Hidden",
] as const;

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  Office: "Office",
  Retail: "Retail",
  Warehouse: "Warehouse",
  Technical: "Technical",
  Parking: "Parking",
  CommonArea: "Common Area",
  MeetingRoom: "Meeting Room",
  Corridor: "Corridor",
  Toilet: "Toilet",
  Other: "Other",
};

export const SPACE_TYPE_OPTIONS = SPACE_TYPES.map((type) => ({
  value: type,
  label: SPACE_TYPE_LABELS[type],
}));

/** Tailwind classes mirroring the canvas colours so lists and legends stay in sync. */
export const STATUS_META: Record<SpaceStatus, { label: string; dot: string; badge: string }> = {
  Available: {
    label: "Available",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  Occupied: {
    label: "Occupied",
    dot: "bg-red-500",
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  Reserved: {
    label: "Reserved",
    dot: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  Maintenance: {
    label: "Maintenance",
    dot: "bg-zinc-400",
    badge: "bg-zinc-400/15 text-zinc-300 border-zinc-400/30",
  },
  Hidden: {
    label: "Hidden",
    dot: "bg-zinc-600",
    badge: "bg-zinc-600/15 text-zinc-400 border-zinc-600/30",
  },
};
