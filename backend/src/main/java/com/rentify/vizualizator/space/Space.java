package com.rentify.vizualizator.space;

import com.rentify.vizualizator.floor.Floor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "spaces")
public class Space {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(nullable = false, length = 64)
    private String number;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SpaceType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SpaceStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<SpacePoint> polygon = new ArrayList<>();

    @Column(name = "geometric_area")
    private Double geometricArea;

    @Column(name = "rentable_area")
    private Double rentableArea;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Floor getFloor() {
        return floor;
    }

    public void setFloor(Floor floor) {
        this.floor = floor;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SpaceType getType() {
        return type;
    }

    public void setType(SpaceType type) {
        this.type = type;
    }

    public SpaceStatus getStatus() {
        return status;
    }

    public void setStatus(SpaceStatus status) {
        this.status = status;
    }

    public List<SpacePoint> getPolygon() {
        return polygon;
    }

    public void setPolygon(List<SpacePoint> polygon) {
        this.polygon = polygon;
    }

    public Double getGeometricArea() {
        return geometricArea;
    }

    public void setGeometricArea(Double geometricArea) {
        this.geometricArea = geometricArea;
    }

    public Double getRentableArea() {
        return rentableArea;
    }

    public void setRentableArea(Double rentableArea) {
        this.rentableArea = rentableArea;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
