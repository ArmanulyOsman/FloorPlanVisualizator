package com.vizualizator.space;

import com.vizualizator.common.exception.NotFoundException;
import com.vizualizator.common.exception.ValidationException;
import com.vizualizator.common.geometry.AreaCalculator;
import com.vizualizator.common.geometry.PointDto;
import com.vizualizator.common.geometry.PolygonValidator;
import com.vizualizator.floor.Floor;
import com.vizualizator.floor.FloorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final FloorService floorService;
    private final SpaceMapper spaceMapper;

    public SpaceResponse create(CreateSpaceRequest request) {
        var floor = floorService.getFloor(request.floorId());

        if (spaceRepository.existsByFloorIdAndNumber(floor.getId(), request.number())) {
            throw new ValidationException("Room number already exists on this floor");
        }

        var normalizedPolygon = PolygonValidator.normalizePolygon(request.polygon());

        Space space = new Space();
        space.setFloor(floor);
        space.setNumber(request.number().trim());
        space.setName(request.name().trim());
        space.setType(request.type());
        space.setStatus(request.status());
        space.setPolygon(toSpacePoints(normalizedPolygon));
        space.setRentableArea(request.rentableArea());
        space.setNotes(request.notes());
        space.setGeometricArea(calculateGeometricArea(floor, normalizedPolygon));

        var saved = spaceRepository.save(space);
        return spaceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SpaceResponse findById(UUID id) {
        Space space = getSpace(id);
        return spaceMapper.toResponse(space);
    }

    public SpaceResponse update(UUID id, UpdateSpaceRequest request) {
        Space space = getSpace(id);
        Floor floor = space.getFloor();

        if (request.number() != null) {
            String number = request.number().trim();
            if (number.isBlank()) {
                throw new ValidationException("Room number cannot be blank");
            }
            if (!number.equals(space.getNumber())
                    && spaceRepository.existsByFloorIdAndNumberAndIdNot(floor.getId(), number, id)) {
                throw new ValidationException("Room number already exists on this floor");
            }
            space.setNumber(number);
        }

        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new ValidationException("Room name cannot be blank");
            }
            space.setName(request.name().trim());
        }

        if (request.type() != null) {
            space.setType(request.type());
        }

        if (request.status() != null) {
            space.setStatus(request.status());
        }

        if (request.polygon() != null) {
            List<PointDto> normalizedPolygon = PolygonValidator.normalizePolygon(request.polygon());
            space.setPolygon(toSpacePoints(normalizedPolygon));
            space.setGeometricArea(calculateGeometricArea(floor, normalizedPolygon));
        }

        if (request.rentableArea() != null) {
            space.setRentableArea(request.rentableArea());
        }

        if (request.notes() != null) {
            space.setNotes(request.notes());
        }

        return spaceMapper.toResponse(space);
    }

    public void delete(UUID id) {
        var space = getSpace(id);
        space.setIsActive(false);
        spaceRepository.save(space);
    }

    public Space getSpace(UUID id) {
        return spaceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Space not found: " + id));
    }

    private List<SpacePoint> toSpacePoints(List<PointDto> polygon) {
        return polygon.stream()
                .map(point -> new SpacePoint(point.x(), point.y()))
                .toList();
    }

    private Double calculateGeometricArea(Floor floor, List<PointDto> polygon) {
        return AreaCalculator.calculateGeometricArea(
                polygon,
                floor.getMetersPerPixel(),
                floor.getWidth(),
                floor.getHeight()
        );
    }
}
