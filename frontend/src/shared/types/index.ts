export type Point = {
  x: number;
  y: number;
};

export type SpaceType =
  | "Office"
  | "Retail"
  | "Warehouse"
  | "Technical"
  | "Parking"
  | "CommonArea"
  | "MeetingRoom"
  | "Corridor"
  | "Toilet"
  | "Other";

export type SpaceStatus =
  | "Available"
  | "Occupied"
  | "Reserved"
  | "Maintenance"
  | "Hidden";

export type Space = {
  id: string;
  floorId: string;
  number: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  polygon: Point[];
  geometricArea: number | null;
  rentableArea: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Floor = {
  id: string;
  buildingId: string;
  name: string;
  number: number;
  pdfUrl: string;
  pdfPage: number;
  width: number;
  height: number;
  metersPerPixel: number | null;
  spaces: Space[];
  createdAt: string;
  updatedAt: string;
};

export type FloorSummary = {
  id: string;
  name: string;
  number: number;
  pdfUrl: string;
  pdfPage: number;
  width: number;
  height: number;
  metersPerPixel: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Building = {
  id: string;
  name: string;
  address: string | null;
  floors: FloorSummary[];
  createdAt: string;
  updatedAt: string;
};

export type EditorMode = "view" | "draw" | "edit" | "select" | "calibrate";

export type Viewport = {
  scale: number;
  x: number;
  y: number;
};

export type CreateSpacePayload = {
  floorId: string;
  number: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  polygon: Point[];
  rentableArea?: number | null;
  notes?: string | null;
};

export type UpdateSpacePayload = {
  number?: string;
  name?: string;
  type?: SpaceType;
  status?: SpaceStatus;
  polygon?: Point[];
  rentableArea?: number | null;
  notes?: string | null;
};

export type PanelMode = "idle" | "create" | "edit";
