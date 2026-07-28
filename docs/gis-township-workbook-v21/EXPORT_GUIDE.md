# GIS Workbook V2.1 — Export Guide

**Marker:** `GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE`

---

## Overview

Export emits GIS data from the layout workspace. When writing **V2.1 polygon sheets**, every exported ring must include an **explicit closing coordinate**.

---

## Export sheet order

1. Project  
2. Statistics *(computed)*  
3. SurveyReference  
4. Boundary  
5. Entrances  
6. Roads  
7. Blocks *(if present)*  
8. PlotGeometry  
9. Amenities  
10. Utilities  
11. Landscaping  
12. PlotMaster  

---

## Polygon export rules

When exploding polygons to coordinate rows:

### Boundary

- Emit vertices in order: Sequence 1 … Sequence N  
- **Append closing row:** duplicate Sequence 1 as the final row  

### PlotGeometry

For each plot polygon:

| ProjectID | PlotID | Sequence | Latitude | Longitude |
|-----------|--------|----------|----------|-----------|
| … | P-A101 | 1 | lat₁ | lng₁ |
| … | P-A101 | 2 | lat₂ | lng₂ |
| … | … | … | … | … |
| … | P-A101 | N | lat₁ | lng₁ |

### Blocks

Same pattern grouped by `BlockID`. Include `BlockName` and `LandUse` on each row.

### Amenities

Same pattern grouped by `AmenityID`. Include `Type` and `Label` on each row.

---

## Non-polygon export rules

| Sheet | Export behaviour |
|-------|------------------|
| **Roads** | One row per centerline vertex; **no** closing duplicate |
| **Entrances** | Single point row (or polyline if spec extended later) |
| **Utilities** | Point: one row; Polyline/Polygon: future spec |
| **Landscaping** | Point: one row |

---

## PlotMaster

Export scalar inventory only — **no** Latitude/Longitude columns.

Join key: `(ProjectID, PlotID)` ↔ PlotGeometry.

---

## Closing coordinate checklist

Before saving an exported workbook:

- [ ] Every Boundary ring ends with Sequence N = Sequence 1  
- [ ] Every PlotID ring in PlotGeometry closes explicitly  
- [ ] Every BlockID ring in Blocks closes explicitly *(if sheet used)*  
- [ ] Every AmenityID ring in Amenities closes explicitly *(if sheet used)*  
- [ ] Roads / Entrances / Utility points have **no** artificial closing row  

---

## Reference

- Template samples: `workbookV21Constants.js` (`SAMPLE_*_ROWS`)  
- Ring standard: `closedPolygonStandard.js`  
- Legacy export path: `layoutExcelExporter.exportLayout()` *(Layout/Roads/Amenities/Plots — separate from V2.1 template)*  
