package com.rentify.vizualizator.floor;

import com.rentify.vizualizator.space.SpaceMapper;
import com.rentify.vizualizator.storage.LocalFileStorageService;
import org.springframework.stereotype.Component;

@Component
public class FloorMapper {

    private final LocalFileStorageService fileStorageService;
    private final SpaceMapper spaceMapper;

    public FloorMapper(LocalFileStorageService fileStorageService, SpaceMapper spaceMapper) {
        this.fileStorageService = fileStorageService;
        this.spaceMapper = spaceMapper;
    }

    public FloorSummaryResponse toSummary(Floor floor) {
        return new FloorSummaryResponse(
                floor.getId(),
                floor.getName(),
                floor.getNumber(),
                fileStorageService.buildPublicUrl(floor.getId()),
                floor.getPdfPage(),
                floor.getWidth(),
                floor.getHeight(),
                floor.getMetersPerPixel(),
                floor.getCreatedAt(),
                floor.getUpdatedAt()
        );
    }

    public FloorResponse toResponse(Floor floor) {
        return new FloorResponse(
                floor.getId(),
                floor.getBuilding().getId(),
                floor.getName(),
                floor.getNumber(),
                fileStorageService.buildPublicUrl(floor.getId()),
                floor.getPdfPage(),
                floor.getWidth(),
                floor.getHeight(),
                floor.getMetersPerPixel(),
                floor.getSpaces().stream().map(spaceMapper::toResponse).toList(),
                floor.getCreatedAt(),
                floor.getUpdatedAt()
        );
    }
}
