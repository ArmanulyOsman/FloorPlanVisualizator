package com.rentify.vizualizator.building;

import com.rentify.vizualizator.common.exception.NotFoundException;
import com.rentify.vizualizator.floor.FloorMapper;
import com.rentify.vizualizator.floor.FloorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final FloorMapper floorMapper;

    public BuildingService(
            BuildingRepository buildingRepository,
            FloorRepository floorRepository,
            FloorMapper floorMapper
    ) {
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.floorMapper = floorMapper;
    }

    public BuildingResponse create(CreateBuildingRequest request) {
        Building building = new Building();
        building.setName(request.name());
        building.setAddress(request.address());
        Building saved = buildingRepository.save(building);
        return toResponse(saved, List.of());
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> findAll() {
        return buildingRepository.findAll().stream()
                .map(building -> toResponse(
                        building,
                        floorRepository.findByBuildingIdOrderByNumberAsc(building.getId()).stream()
                                .map(floorMapper::toSummary)
                                .toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public BuildingResponse findById(UUID id) {
        Building building = getBuilding(id);
        var floors = floorRepository.findByBuildingIdOrderByNumberAsc(id).stream()
                .map(floorMapper::toSummary)
                .toList();
        return toResponse(building, floors);
    }

    public Building getBuilding(UUID id) {
        return buildingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Building not found: " + id));
    }

    private BuildingResponse toResponse(Building building, List<com.rentify.vizualizator.floor.FloorSummaryResponse> floors) {
        return new BuildingResponse(
                building.getId(),
                building.getName(),
                building.getAddress(),
                floors,
                building.getCreatedAt(),
                building.getUpdatedAt()
        );
    }
}
