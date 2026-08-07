package com.vizualizator.floor;

import java.time.Instant;
import java.util.UUID;

public record FloorSummaryResponse(
        UUID id,
        String name,
        Integer number,
        String pdfUrl,
        Integer pdfPage,
        Double width,
        Double height,
        Double metersPerPixel,
        Instant createdAt,
        Instant updatedAt
) {
}
