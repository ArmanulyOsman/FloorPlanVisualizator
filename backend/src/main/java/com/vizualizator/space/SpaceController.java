package com.vizualizator.space;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Spaces", description = "Управление помещениями на плане")
@RestController
@RequestMapping("/api/spaces")
public class SpaceController {

    private final SpaceService spaceService;

    public SpaceController(SpaceService spaceService) {
        this.spaceService = spaceService;
    }

    @Operation(summary = "Создать помещение")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpaceResponse create(@Valid @RequestBody CreateSpaceRequest request) {
        return spaceService.create(request);
    }

    @Operation(summary = "Получить помещение по ID")
    @GetMapping("/{id}")
    public SpaceResponse findById(@PathVariable UUID id) {
        return spaceService.findById(id);
    }

    @Operation(summary = "Обновить помещение")
    @PatchMapping("/{id}")
    public SpaceResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSpaceRequest request) {
        return spaceService.update(id, request);
    }

    @Operation(summary = "Удалить помещение")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        spaceService.delete(id);
    }
}
