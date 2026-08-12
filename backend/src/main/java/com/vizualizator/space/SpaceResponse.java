package com.vizualizator.space;

import com.vizualizator.common.geometry.PointDto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SpaceResponse(
    UUID id,
    UUID floorId,
    String number,
    String name,
    SpaceType type,
    SpaceStatus status,
    List<PointDto> polygon,
    Double geometricArea,
    Double rentableArea,
    String notes,
    Instant createdAt,
    Instant updatedAt
) {
}
