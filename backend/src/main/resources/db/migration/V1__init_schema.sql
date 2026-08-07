CREATE TABLE buildings (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(512),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
    id                UUID PRIMARY KEY,
    building_id       UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    number            INTEGER NOT NULL,
    pdf_path          VARCHAR(1024) NOT NULL,
    pdf_page          INTEGER NOT NULL DEFAULT 0,
    width             DOUBLE PRECISION NOT NULL,
    height            DOUBLE PRECISION NOT NULL,
    meters_per_pixel  DOUBLE PRECISION,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (building_id, number)
);

CREATE INDEX idx_floors_building_id ON floors(building_id);

CREATE TABLE spaces (
    id               UUID PRIMARY KEY,
    floor_id         UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    number           VARCHAR(64) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    type             VARCHAR(32) NOT NULL,
    status           VARCHAR(32) NOT NULL,
    polygon          JSONB NOT NULL,
    geometric_area   DOUBLE PRECISION,
    rentable_area    DOUBLE PRECISION,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (floor_id, number)
);

CREATE INDEX idx_spaces_floor_id ON spaces(floor_id);

CREATE TABLE rentable_units (
    id             UUID PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    rentable_area  DOUBLE PRECISION,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rentable_unit_spaces (
    rentable_unit_id UUID NOT NULL REFERENCES rentable_units(id) ON DELETE CASCADE,
    space_id         UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    PRIMARY KEY (rentable_unit_id, space_id)
);

CREATE TABLE leases (
    id                UUID PRIMARY KEY,
    rentable_unit_id  UUID NOT NULL REFERENCES rentable_units(id) ON DELETE CASCADE,
    tenant_id         UUID NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leases_rentable_unit_id ON leases(rentable_unit_id);
