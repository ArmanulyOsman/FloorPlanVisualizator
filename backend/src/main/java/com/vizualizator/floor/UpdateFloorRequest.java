package com.vizualizator.floor;

import jakarta.validation.constraints.Positive;

public record UpdateFloorRequest(
        String name,
        @Positive Integer number,
        @Positive Double metersPerPixel,
        @Positive Double width,
        @Positive Double height
) {
}
