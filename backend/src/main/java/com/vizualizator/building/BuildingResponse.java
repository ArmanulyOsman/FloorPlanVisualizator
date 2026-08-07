package com.vizualizator.building;

import com.vizualizator.floor.FloorSummaryResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BuildingResponse(
        UUID id,
        String name,
        String address,
        List<FloorSummaryResponse> floors,
        Instant createdAt,
        Instant updatedAt
) {
}
