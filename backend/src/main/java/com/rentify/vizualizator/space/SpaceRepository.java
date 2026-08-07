package com.rentify.vizualizator.space;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SpaceRepository extends JpaRepository<Space, UUID> {

    boolean existsByFloorIdAndNumber(UUID floorId, String number);

    boolean existsByFloorIdAndNumberAndIdNot(UUID floorId, String number, UUID id);
}
