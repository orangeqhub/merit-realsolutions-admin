# GIS Township Workbook V2.1 — Specification

**Format version:** `2.1.0`  
**Completion marker:** `GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE`

---

## Closed Polygon Ring Standard (V2.1)

### Rule

All **polygon geometry sheets** must **explicitly close** every ring:

> The last coordinate row **must repeat the first coordinate row** — `Sequence N` = `Sequence 1` (same `Latitude` and `Longitude`).

This is **required in the workbook**. The import validator **does not** silently auto-close rings during validation.

### Polygon sheets (closed rings required)

| Sheet | Group key | Core columns | Optional metadata |
|-------|-----------|--------------|-----------------|
| **Boundary** | Single ring | ProjectID, Sequence, Latitude, Longitude | — |
| **Blocks** | `BlockID` | ProjectID, BlockID, Sequence, Latitude, Longitude | BlockName, LandUse |
| **PlotGeometry** | `PlotID` | ProjectID, PlotID, Sequence, Latitude, Longitude | — |
| **Amenities** | `AmenityID` | ProjectID, AmenityID, Sequence, Latitude, Longitude | Type, Label |

**Optional sheets:** If Blocks or Amenities exists with **header row only** (no coordinate data rows), validation **passes** and polygon checks are skipped.

### Non-polygon coordinate sheets (no closing row)

These sheets use coordinates but **must not** use closed polygon rings:

| Sheet | Geometry | Closing row |
|-------|----------|-------------|
| **Roads** | Polyline centerline | Not required |
| **Entrances** | Point / access | Not required |
| **Utilities** | Point (V2.1) | Not required |
| **Landscaping** | Point (V2.1) | Not required |

---

## Example — Explicit closing coordinate

Rectangle boundary (5 rows — row 5 closes row 1):

| ProjectID | Sequence | Latitude | Longitude |
|-----------|----------|----------|-----------|
| PRJ-001 | 1 | 16.55665 | 80.38235 |
| PRJ-001 | 2 | 16.55665 | 80.38850 |
| PRJ-001 | 3 | 16.55480 | 80.38850 |
| PRJ-001 | 4 | 16.55480 | 80.38235 |
| PRJ-001 | **5** | **16.55665** | **80.38235** |

Row 5 **must** match row 1 exactly.

The downloadable template (`LayoutExcelExporter.downloadTemplate`) includes closed examples on **Boundary**, **Blocks**, **PlotGeometry**, and **Amenities**.

---

## Workbook structure (12 sheets)

1. Project  
2. Statistics  
3. SurveyReference  
4. Boundary *(polygon)*  
5. Entrances *(point)*  
6. Roads *(polyline)*  
7. Blocks *(polygon, optional)*  
8. PlotGeometry *(polygon)*  
9. Amenities *(polygon)*  
10. Utilities *(point in V2.1)*  
11. Landscaping *(point in V2.1)*  
12. PlotMaster *(no coordinates)*  

---

## Validation examples

See [VALIDATION_EXAMPLES.md](./VALIDATION_EXAMPLES.md).

---

## Import guide

See [IMPORT_GUIDE.md](./IMPORT_GUIDE.md).

---

## Export guide

See [EXPORT_GUIDE.md](./EXPORT_GUIDE.md).

---

## Migration guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).
