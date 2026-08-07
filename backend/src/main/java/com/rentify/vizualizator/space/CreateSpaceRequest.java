package com.rentify.vizualizator.space;

import com.rentify.vizualizator.common.geometry.PointDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateSpaceRequest(
        @NotNull UUID floorId,
        @NotBlank String number,
        @NotBlank String name,
        @NotNull SpaceType type,
        @NotNull SpaceStatus status,
        @NotEmpty @Valid List<PointDto> polygon,
        Double rentableArea,
        String notes
) {
}
