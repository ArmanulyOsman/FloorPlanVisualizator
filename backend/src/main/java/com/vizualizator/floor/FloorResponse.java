package com.vizualizator.floor;

import com.vizualizator.space.SpaceResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FloorResponse(
        UUID id,
        UUID buildingId,
        String name,
        Integer number,
        String pdfUrl,
        Integer pdfPage,
        Double width,
        Double height,
        Double metersPerPixel,
        List<SpaceResponse> spaces,
        Instant createdAt,
        Instant updatedAt
) {
}
