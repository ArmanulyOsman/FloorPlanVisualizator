# Rentify Floor Plan Editor PRD

## Project Overview

Develop an internal **Floor Plan Editor** for Rentify that allows landlords and property managers to upload a 2D floor plan (PDF), digitize rooms by drawing polygons, and connect those rooms with rentable units and lease contracts.

The editor must become the foundation for an interactive building map inside Rentify.

The long-term goal is to support:

- Office buildings
- Shopping malls
- Warehouses
- Business centers
- Mixed-use properties

---

# Goal

Transform a static PDF floor plan into an interactive digital floor plan.

Example workflow:

PDF Floor Plan
↓
Draw Rooms
↓
Create Spaces
↓
Group into Rentable Units
↓
Assign Tenants
↓
Interactive Building Map

---

# Important

This is NOT a GIS application.

There are no latitude/longitude coordinates.

The coordinate system exists only inside the PDF page.

Store coordinates normalized (0..1).

Example:

```json
{
  "x": 0.348,
  "y": 0.712
}
```

---

# Tech Stack

Frontend

- React
- Next.js
- TypeScript
- React Konva
- PDF.js
- Zustand
- React Hook Form

Backend

- Spring Boot
- PostgreSQL
- REST API

Storage

- S3 / MinIO for PDF files

---

# Core Entities

## Building

```ts
Building {
    id
    name
    address
}
```

---

## Floor

```ts
Floor {
    id
    buildingId

    name
    number

    pdfUrl

    pdfPage

    width
    height

    metersPerPixel
}
```

---

## Space

Represents a physical room.

```ts
Space {

    id

    floorId

    number

    name

    type

    status

    polygon[]

    geometricArea

    rentableArea

}
```

---

## Rentable Unit

Commercial unit available for rent.

May consist of multiple spaces.

```ts
RentableUnit {

    id

    name

    spaceIds[]

    rentableArea

}
```

---

## Lease

```ts
Lease {

    id

    rentableUnitId

    tenantId

}
```

---

# Editor Features

## Upload PDF

User uploads:

- PDF
- Multi-page PDF

Each page may represent a floor.

---

## PDF Viewer

Features:

- Zoom
- Pan
- Fit width
- Fit page

---

## Drawing Mode

User clicks around room edges.

Example:

Click
↓

Point

↓

Point

↓

Point

↓

Click first point

↓

Polygon completed

---

Requirements

- Minimum 3 points
- Polygon automatically closes
- ESC cancels drawing
- Backspace removes last point
- Enter completes polygon

---

# Edit Mode

User can

- Move vertices
- Delete vertices
- Add vertices
- Move polygon
- Rename room

---

# Selection Mode

Click room

↓

Highlight polygon

↓

Display properties panel

---

# Properties Panel

Fields

Room Number

Room Name

Type

Status

Geometric Area

Rentable Area

Notes

---

# Room Types

- Office
- Retail
- Warehouse
- Technical
- Parking
- Common Area
- Meeting Room
- Corridor
- Toilet
- Other

---

# Statuses

- Available
- Occupied
- Reserved
- Maintenance
- Hidden

---

# Polygon Storage

Store normalized coordinates.

Example

```json
[
    {
        "x":0.14,
        "y":0.21
    },
    {
        "x":0.44,
        "y":0.21
    },
    {
        "x":0.44,
        "y":0.55
    }
]
```

---

# Geometry Validation

Before saving

Validate

- polygon closed
- minimum 3 points
- no self intersections
- inside page
- no duplicated room number

---

# Area Calculation

Support two areas.

## Geometric Area

Calculated from polygon.

## Rentable Area

Entered manually.

These values are independent.

---

# Calibration

User selects

Point A

Point B

Enters

Known distance (meters)

Example

10 meters

System calculates

metersPerPixel

Used for area calculation.

---

# Snap

Version 1

Snap to

- Existing vertices

Future

- Wall
- Edge
- Grid
- Horizontal
- Vertical

---

# Undo / Redo

Support

Ctrl+Z

Ctrl+Shift+Z

---

# Layer Structure

Stage

PDF Layer

↓

Space Layer

↓

Selection Layer

↓

Drawing Layer

---

# Color Legend

Available

Green

Occupied

Red

Reserved

Orange

Maintenance

Gray

Selected

Blue

---

# API

POST

/api/floors

Upload PDF

---

POST

/api/spaces

Create room

---

PATCH

/api/spaces/{id}

Update room

---

DELETE

/api/spaces/{id}

Delete room

---

GET

/api/floors/{id}

Return floor with all rooms

---

# Database

Tables

buildings

floors

spaces

rentable_units

leases

---

# Future Features

## Auto Detection

Automatically detect rooms from PDF.

Pipeline

PDF

↓

Extract Lines

↓

Detect Closed Shapes

↓

Suggest Rooms

↓

Manual Approval

---

## OCR

Read

Room Number

Room Name

Area

from PDF.

---

## Version History

Every floor change creates

Version

Restore previous version.

---

## Collaboration

Multiple users editing.

Optimistic locking.

Conflict resolution.

---

## Import

Support

- SVG
- DXF
- DWG
- GeoJSON

---

## Export

Support

- SVG
- PNG
- PDF
- JSON

---

# UI Requirements

Modern SaaS style.

Inspired by

- Figma
- Miro
- Linear
- Arc Browser

Dark mode support.

Smooth zoom.

Smooth pan.

60 FPS interaction.

---

# AI Coding Instructions

You are a Senior Staff Software Engineer.

Follow these rules strictly.

1. Write production-ready code only.
2. No placeholders.
3. No TODO comments.
4. No mock implementations.
5. Follow SOLID principles.
6. Use Feature-Based Architecture.
7. Components must be reusable.
8. Avoid duplicated code.
9. Strong TypeScript typing.
10. Clean architecture.
11. Small focused React components.
12. Custom hooks where appropriate.
13. No any types.
14. Use functional components.
15. Keep files under 300 lines when possible.
16. Write clean, maintainable code.
17. Explain architectural decisions before implementation.
18. Think through edge cases before writing code.
19. Always preserve backward compatibility.
20. If uncertain, ask before implementing.

---

# Development Roadmap

## Phase 1

- PDF Viewer
- Zoom
- Pan
- Polygon Drawing
- Save Rooms

---

## Phase 2

- Polygon Editing
- Snap
- Undo
- Room Properties

---

## Phase 3

- Rentable Units
- Lease Integration
- Interactive Availability Map

---

## Phase 4

- OCR
- Auto Room Detection
- AI Suggestions
- DXF/DWG Import

---

# Success Criteria

The editor should allow a property manager to upload any building floor plan and digitize an entire floor without external software.

The resulting floor becomes fully interactive and integrated into Rentify's leasing system.