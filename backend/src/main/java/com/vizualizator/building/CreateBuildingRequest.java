package com.vizualizator.building;

import jakarta.validation.constraints.NotBlank;

public record CreateBuildingRequest(
        @NotBlank String name,
        String address
) {
}
