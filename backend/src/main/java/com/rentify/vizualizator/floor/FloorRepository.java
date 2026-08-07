package com.rentify.vizualizator.floor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorRepository extends JpaRepository<Floor, UUID> {

    List<Floor> findByBuildingIdOrderByNumberAsc(UUID buildingId);

    boolean existsByBuildingIdAndNumber(UUID buildingId, Integer number);

    @Query("""
            select f from Floor f
            left join fetch f.spaces
            where f.id = :id
            """)
    Optional<Floor> findByIdWithSpaces(@Param("id") UUID id);
}
