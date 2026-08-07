package com.vizualizator.space;

import com.vizualizator.common.geometry.PointDto;
import org.springframework.stereotype.Component;

@Component
public class SpaceMapper {

    public SpaceResponse toResponse(Space space) {
        return new SpaceResponse(
                space.getId(),
                space.getFloor().getId(),
                space.getNumber(),
                space.getName(),
                space.getType(),
                space.getStatus(),
                space.getPolygon().stream()
                        .map(point -> new PointDto(point.x(), point.y()))
                        .toList(),
                space.getGeometricArea(),
                space.getRentableArea(),
                space.getNotes(),
                space.getCreatedAt(),
                space.getUpdatedAt()
        );
    }
}
