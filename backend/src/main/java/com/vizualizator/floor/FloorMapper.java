package com.vizualizator.floor;

import com.vizualizator.space.SpaceMapper;
import com.vizualizator.storage.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FloorMapper {

    private final LocalFileStorageService fileStorageService;
    private final SpaceMapper spaceMapper;

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
