export const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  Available: { fill: "rgba(34, 197, 94, 0.35)", stroke: "#22c55e" },
  Occupied: { fill: "rgba(239, 68, 68, 0.35)", stroke: "#ef4444" },
  Reserved: { fill: "rgba(249, 115, 22, 0.35)", stroke: "#f97316" },
  Maintenance: { fill: "rgba(156, 163, 175, 0.35)", stroke: "#9ca3af" },
  Hidden: { fill: "rgba(107, 114, 128, 0.2)", stroke: "#6b7280" },
};

export const SELECTED_COLOR = { fill: "rgba(59, 130, 246, 0.45)", stroke: "#3b82f6" };
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
