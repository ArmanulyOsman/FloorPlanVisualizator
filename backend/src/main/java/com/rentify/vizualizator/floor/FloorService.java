package com.rentify.vizualizator.floor;

import com.rentify.vizualizator.building.BuildingService;
import com.rentify.vizualizator.common.exception.NotFoundException;
import com.rentify.vizualizator.common.exception.ValidationException;
import com.rentify.vizualizator.common.geometry.AreaCalculator;
import com.rentify.vizualizator.common.geometry.PointDto;
import com.rentify.vizualizator.space.Space;
import com.rentify.vizualizator.storage.LocalFileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingService buildingService;
    private final LocalFileStorageService fileStorageService;
    private final PdfMetadataExtractor pdfMetadataExtractor;
    private final FloorMapper floorMapper;

    public FloorService(
            FloorRepository floorRepository,
            BuildingService buildingService,
            LocalFileStorageService fileStorageService,
            PdfMetadataExtractor pdfMetadataExtractor,
            FloorMapper floorMapper
    ) {
        this.floorRepository = floorRepository;
        this.buildingService = buildingService;
        this.fileStorageService = fileStorageService;
        this.pdfMetadataExtractor = pdfMetadataExtractor;
        this.floorMapper = floorMapper;
    }

    public FloorResponse create(UUID buildingId, String name, Integer number, Integer pdfPage, MultipartFile file) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("Floor name is required");
        }
        if (number == null || number <= 0) {
            throw new ValidationException("Floor number must be positive");
        }

        int pageIndex = pdfPage == null ? 0 : pdfPage;
        var building = buildingService.getBuilding(buildingId);

        if (floorRepository.existsByBuildingIdAndNumber(buildingId, number)) {
            throw new ValidationException("Floor number already exists for this building");
        }

        PdfMetadataExtractor.PdfPageMetadata metadata = pdfMetadataExtractor.extract(file, pageIndex);

        UUID floorId = UUID.randomUUID();
        LocalFileStorageService.StoredFile storedFile = fileStorageService.storePdf(buildingId, floorId, file);

        Floor floor = new Floor();
        floor.setId(floorId);
        floor.setBuilding(building);
        floor.setName(name.trim());
        floor.setNumber(number);
        floor.setPdfPage(pageIndex);
        floor.setWidth((double) metadata.width());
        floor.setHeight((double) metadata.height());
        floor.setPdfPath(storedFile.relativePath());

        Floor savedFloor = floorRepository.save(floor);
        return floorMapper.toResponse(savedFloor);
    }

    @Transactional(readOnly = true)
    public FloorResponse findById(UUID id) {
        Floor floor = floorRepository.findByIdWithSpaces(id)
                .orElseThrow(() -> new NotFoundException("Floor not found: " + id));
        return floorMapper.toResponse(floor);
    }

    @Transactional(readOnly = true)
    public List<FloorSummaryResponse> findByBuildingId(UUID buildingId) {
        buildingService.getBuilding(buildingId);
        return floorRepository.findByBuildingIdOrderByNumberAsc(buildingId).stream()
                .map(floorMapper::toSummary)
                .toList();
    }

    public FloorResponse update(UUID id, UpdateFloorRequest request) {
        Floor floor = getFloor(id);

        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new ValidationException("Floor name cannot be blank");
            }
            floor.setName(request.name().trim());
        }

        if (request.number() != null) {
            UUID buildingId = floor.getBuilding().getId();
            if (!request.number().equals(floor.getNumber())
                    && floorRepository.existsByBuildingIdAndNumber(buildingId, request.number())) {
                throw new ValidationException("Floor number already exists for this building");
            }
            floor.setNumber(request.number());
        }

        if (request.metersPerPixel() != null) {
            floor.setMetersPerPixel(request.metersPerPixel());
            recalculateSpacesGeometricArea(floor);
        }

        if (request.width() != null) {
            floor.setWidth(request.width());
        }

        if (request.height() != null) {
            floor.setHeight(request.height());
        }

        return floorMapper.toResponse(floor);
    }

    public void delete(UUID id) {
        Floor floor = getFloor(id);
        fileStorageService.delete(floor.getPdfPath());
        floorRepository.delete(floor);
    }

    public Floor getFloor(UUID id) {
        return floorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Floor not found: " + id));
    }

    private void recalculateSpacesGeometricArea(Floor floor) {
        for (Space space : floor.getSpaces()) {
            Double geometricArea = AreaCalculator.calculateGeometricArea(
                    space.getPolygon().stream().map(point -> new PointDto(point.x(), point.y())).toList(),
                    floor.getMetersPerPixel(),
                    floor.getWidth(),
                    floor.getHeight()
            );
            space.setGeometricArea(geometricArea);
        }
    }
}
