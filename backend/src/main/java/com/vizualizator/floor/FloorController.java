package com.vizualizator.floor;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Tag(name = "Floors", description = "Управление этажами и PDF-планами")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/floors")
public class FloorController {

    private final FloorService floorService;

    @Operation(summary = "Загрузить этаж с PDF-планом")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FloorResponse create(
            @RequestParam UUID buildingId,
            @RequestParam String name,
            @RequestParam Integer number,
            @RequestParam(required = false) Integer pdfPage,
            @RequestParam("file") MultipartFile file
    ) {
        return floorService.create(buildingId, name, number, pdfPage, file);
    }

    @Operation(summary = "Получить этаж с комнатами")
    @GetMapping("/{id}")
    public FloorResponse findById(@PathVariable UUID id) {
        return floorService.findById(id);
    }

    @Operation(summary = "Список этажей здания")
    @GetMapping
    public List<FloorSummaryResponse> findByBuildingId(@RequestParam UUID buildingId) {
        return floorService.findByBuildingId(buildingId);
    }

    @Operation(summary = "Обновить этаж (калибровка, название)")
    @PatchMapping("/{id}")
    public FloorResponse update(@PathVariable UUID id, @RequestBody UpdateFloorRequest request) {
        return floorService.update(id, request);
    }

    @Operation(summary = "Удалить этаж")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        floorService.delete(id);
    }
}
