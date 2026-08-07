package com.vizualizator.space;

import com.vizualizator.common.geometry.PointDto;
import jakarta.validation.Valid;

import java.util.List;

public record UpdateSpaceRequest(
        String number,
        String name,
        SpaceType type,
        SpaceStatus status,
        @Valid List<PointDto> polygon,
        Double rentableArea,
        String notes
) {
}
