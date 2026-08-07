package com.rentify.vizualizator.space;

import com.rentify.vizualizator.common.exception.NotFoundException;
import com.rentify.vizualizator.common.exception.ValidationException;
import com.rentify.vizualizator.common.geometry.AreaCalculator;
import com.rentify.vizualizator.common.geometry.PointDto;
import com.rentify.vizualizator.common.geometry.PolygonValidator;
import com.rentify.vizualizator.floor.Floor;
import com.rentify.vizualizator.floor.FloorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final FloorService floorService;
    private final SpaceMapper spaceMapper;

    public SpaceService(SpaceRepository spaceRepository, FloorService floorService, SpaceMapper spaceMapper) {
        this.spaceRepository = spaceRepository;
        this.floorService = floorService;
        this.spaceMapper = spaceMapper;
    }

    public SpaceResponse create(CreateSpaceRequest request) {
        Floor floor = floorService.getFloor(request.floorId());

        if (spaceRepository.existsByFloorIdAndNumber(floor.getId(), request.number())) {
            throw new ValidationException("Room number already exists on this floor");
        }

        List<PointDto> normalizedPolygon = PolygonValidator.normalizePolygon(request.polygon());

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

        Space saved = spaceRepository.save(space);
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
        Space space = getSpace(id);
        spaceRepository.delete(space);
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
