# GIS Workbook V2.1 — Import Guide

**Marker:** `GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE`

---

## Overview

Import GIS township data from a **GIS Township Workbook V2.1** (`.xlsx`) into an existing layout via **Layout Dashboard → Import GIS Workbook**.

Minimum required sheets:

- **Project**
- **Boundary** *(closed polygon)*
- **PlotGeometry** *(closed polygon per PlotID)*
- **PlotMaster**

---

## Step 1 — Download template

Use **Template** in the import wizard. The template includes:

- Sample **Project** row with `WorkbookFormatVersion = 2.1.0`
- **Boundary** with 5 vertices (Sequence 5 = Sequence 1)
- **Blocks** sample with closed ring *(optional sheet)*
- **PlotGeometry** with closed plot ring
- **Amenities** with closed park polygon
- **PlotMaster** inventory row

---

## Step 2 — Prepare polygon sheets

For every polygon feature, append a **closing row**:

```
Sequence 1 → … → Sequence N
Sequence N must duplicate Sequence 1 (Latitude + Longitude)
```

Apply to:

- Boundary (site extent)
- Blocks (each `BlockID`, if used)
- PlotGeometry (each `PlotID`)
- Amenities (each `AmenityID`)

**Do not** apply closing rows to:

- Roads (polyline)
- Entrances (point)
- Utilities / Landscaping when `GeometryType = Point`

---

## Step 3 — Upload and validate

The wizard runs:

1. **Parse** — detects V2.1 sheets; rejects legacy Layout/Plots workbooks  
2. **Validate** — enforces closed rings, ProjectID consistency, PlotGeometry ↔ PlotMaster join  
3. **Preview** — map summary when validation passes  

Common validation failures:

| Issue | Fix |
|-------|-----|
| Missing closing coordinate | Add final row repeating Sequence 1 |
| Open ring with 4 unique corners | Add 5th row = row 1 |
| PlotMaster without PlotGeometry | Add coordinate rows for that PlotID |
| Wrong WorkbookFormatVersion | Set `2.1.0` on Project sheet |

---

## Step 4 — Confirm import

After validation passes, review the preview summary and confirm import. Inventory flows through the existing import pipeline; geometry must already be valid closed rings in the workbook.

---

## Import order (logical)

1. Project  
2. SurveyReference *(optional)*  
3. Boundary *(closed)*  
4. Entrances *(optional, point)*  
5. Roads *(optional, polyline)*  
6. Blocks *(optional, closed per BlockID)*  
7. PlotGeometry *(closed per PlotID)*  
8. Amenities *(optional, closed per AmenityID)*  
9. Utilities *(optional, point)*  
10. Landscaping *(optional, point)*  
11. PlotMaster  

---

## Reference implementation

- Parse: `workbookParseUtils.js`, `workbookV21Utils.js`  
- Validate: `layoutImportValidator.js`  
- Closed ring standard: `closedPolygonStandard.js`  
