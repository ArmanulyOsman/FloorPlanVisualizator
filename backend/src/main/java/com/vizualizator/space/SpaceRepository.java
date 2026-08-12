package com.vizualizator.space;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SpaceRepository extends JpaRepository<Space, UUID> {

    Boolean existsByFloorIdAndNumber(UUID floorId, String number);

    Boolean existsByFloorIdAndNumberAndIdNot(UUID floorId, String number, UUID id);
}
