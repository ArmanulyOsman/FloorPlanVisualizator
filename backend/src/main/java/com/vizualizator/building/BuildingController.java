package com.vizualizator.building;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Buildings", description = "Управление зданиями")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @Operation(summary = "Создать здание")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BuildingResponse create(@Valid @RequestBody CreateBuildingRequest request) {
        return buildingService.create(request);
    }

    @Operation(summary = "Список зданий")
    @GetMapping
    public List<BuildingResponse> findAll() {
        return buildingService.findAll();
    }

    @Operation(summary = "Получить здание по ID")
    @GetMapping("/{id}")
    public BuildingResponse findById(@PathVariable UUID id) {
        return buildingService.findById(id);
    }
}
