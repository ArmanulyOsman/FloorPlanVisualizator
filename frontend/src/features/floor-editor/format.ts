export function formatArea(squareMeters: number | null | undefined): string | null {
  if (squareMeters === null || squareMeters === undefined || !Number.isFinite(squareMeters)) {
    return null;
  }
  return `${squareMeters.toFixed(squareMeters < 10 ? 2 : 1)} m²`;
}

export function formatZoom(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}

export function formatMetersPerPixel(value: number | null): string | null {
  if (!value || !Number.isFinite(value)) {
    return null;
  }
  const pixelsPerMeter = 1 / value;
  return `${pixelsPerMeter.toFixed(1)} px/m`;
}
