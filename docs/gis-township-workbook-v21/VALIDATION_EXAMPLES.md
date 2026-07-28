# GIS Workbook V2.1 — Validation Examples

**Marker:** `GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE`

---

## Polygon sheets — valid examples

### Boundary (closed)

| ProjectID | Sequence | Latitude | Longitude |
|-----------|----------|----------|-----------|
| PRJ-001 | 1 | 16.55665 | 80.38235 |
| PRJ-001 | 2 | 16.55665 | 80.38850 |
| PRJ-001 | 3 | 16.55480 | 80.38850 |
| PRJ-001 | 4 | 16.55480 | 80.38235 |
| PRJ-001 | 5 | 16.55665 | 80.38235 |

**Result:** Pass — Sequence 5 equals Sequence 1.

### PlotGeometry — PlotID `P-A101` (closed)

| ProjectID | PlotID | Sequence | Latitude | Longitude |
|-----------|--------|----------|----------|-----------|
| PRJ-001 | P-A101 | 1 | 16.55775 | 80.38355 |
| PRJ-001 | P-A101 | 2 | 16.55775 | 80.38385 |
| PRJ-001 | P-A101 | 3 | 16.55755 | 80.38385 |
| PRJ-001 | P-A101 | 4 | 16.55755 | 80.38355 |
| PRJ-001 | P-A101 | 5 | 16.55775 | 80.38355 |

**Result:** Pass.

### Blocks — BlockID `BLK-A` (closed, optional sheet)

| ProjectID | BlockID | BlockName | LandUse | Sequence | Latitude | Longitude |
|-----------|---------|-----------|---------|----------|----------|-----------|
| PRJ-001 | BLK-A | Block A | Residential | 1 | 16.55620 | 80.38300 |
| PRJ-001 | BLK-A | Block A | Residential | 2 | 16.55620 | 80.38600 |
| PRJ-001 | BLK-A | Block A | Residential | 3 | 16.55500 | 80.38600 |
| PRJ-001 | BLK-A | Block A | Residential | 4 | 16.55500 | 80.38300 |
| PRJ-001 | BLK-A | Block A | Residential | 5 | 16.55620 | 80.38300 |

**Result:** Pass.

### Amenities — AmenityID `AMN-1` (closed)

| ProjectID | AmenityID | Type | Label | Sequence | Latitude | Longitude |
|-----------|-----------|------|-------|----------|----------|-----------|
| PRJ-001 | AMN-1 | park | Central Park | 1 | 16.55600 | 80.38450 |
| PRJ-001 | AMN-1 | park | Central Park | 2 | 16.55600 | 80.38550 |
| PRJ-001 | AMN-1 | park | Central Park | 3 | 16.55540 | 80.38550 |
| PRJ-001 | AMN-1 | park | Central Park | 4 | 16.55540 | 80.38450 |
| PRJ-001 | AMN-1 | park | Central Park | 5 | 16.55600 | 80.38450 |

**Result:** Pass.

---

## Polygon sheets — invalid examples

### Open ring (missing closing row)

| Sequence | Latitude | Longitude |
|----------|----------|-----------|
| 1 | 16.55665 | 80.38235 |
| 2 | 16.55665 | 80.38850 |
| 3 | 16.55480 | 80.38850 |
| 4 | 16.55480 | 80.38235 |

**Result:** Fail — `Boundary polygon must be explicitly closed — Sequence 4 must repeat the same Latitude and Longitude as Sequence 1.`

**Fix:** Add row 5 with the same coordinates as row 1.

### Near-match closing row (not exact)

| Sequence | Latitude | Longitude |
|----------|----------|-----------|
| 1 | 16.55665 | 80.38235 |
| … | … | … |
| 5 | 16.55666 | 80.38235 |

**Result:** Fail — coordinates must match within validator tolerance; prefer exact duplicate of Sequence 1.

---

## Non-polygon sheets — valid examples

### Roads (polyline — no closing row)

| ProjectID | RoadID | Sequence | Latitude | Longitude |
|-----------|--------|----------|----------|-----------|
| PRJ-001 | RD-1 | 1 | 16.55665 | 80.38235 |
| PRJ-001 | RD-1 | 2 | 16.55665 | 80.38550 |

**Result:** Pass — polylines do not require a closing coordinate.

### Utilities (Point)

| ProjectID | UtilityID | GeometryType | Sequence | Latitude | Longitude |
|-----------|-----------|--------------|----------|----------|-----------|
| PRJ-001 | UTL-1 | Point | 1 | 16.55580 | 80.38720 |

**Result:** Pass — single point, no closing row.

### Entrances / Landscaping (Point)

Same as Utilities — one coordinate row per feature; **no** closing row.

---

## Error message reference

| Code | Message pattern |
|------|-----------------|
| CP-01 | `{Sheet/Feature} polygon must be explicitly closed — Sequence N must repeat the same Latitude and Longitude as Sequence 1.` |
| CP-02 | `{Sheet} Sequence must be contiguous starting at 1.` |
| CP-03 | `{Sheet} must contain at least 3 coordinate rows.` |

Validation is implemented in `layoutImportValidator.js` via `validateCoordinateVertices()` and `closedPolygonErrorMessage()`.
