# GIS Workbook V2.1 — Migration Guide

**Marker:** `GIS_WORKBOOK_CLOSED_POLYGON_STANDARD_COMPLETE`

---

## Legacy V1 → V2.1 overview

| V1 sheet | V2.1 destination |
|----------|------------------|
| Layout | Project |
| Plots (polygon string + business) | PlotGeometry + PlotMaster |
| Roads (Polyline string) | Roads (multi-row polyline, no close) |
| Amenities (Polygon string) | Amenities (multi-row **closed** polygon) |
| — | Boundary (new, **closed** polygon) |
| — | Blocks (optional, **closed** polygon per BlockID) |

---

## Migrating polygon strings to closed coordinate rows

### V1 Plots.Polygon → PlotGeometry

**Before (V1 — single row):**

```
PlotNo: A101
Polygon: 80.38355,16.55775; 80.38385,16.55775; 80.38385,16.55755; 80.38355,16.55755
```

**After (V2.1 — explicit close):**

| PlotID | Sequence | Latitude | Longitude |
|--------|----------|----------|-----------|
| P-A101 | 1 | 16.55775 | 80.38355 |
| P-A101 | 2 | 16.55775 | 80.38385 |
| P-A101 | 3 | 16.55755 | 80.38385 |
| P-A101 | 4 | 16.55755 | 80.38355 |
| P-A101 | **5** | **16.55775** | **80.38355** |

**Important:** If the V1 string was an open ring (4 unique corners), you **must add** the closing row. The V2.1 validator rejects open rings.

### V1 Amenities.Polygon → Amenities (multi-row)

Same explosion as PlotGeometry, grouped by `AmenityID`, with **closing row required**.

### Derive Boundary

If no boundary existed in V1, digitize the site extent as a new **Boundary** sheet with an explicit closing coordinate.

### Blocks (optional)

If plots used a `Block` column, create **Blocks** polygon rings per `BlockID` or leave BlockID on PlotMaster only without a Blocks sheet.

---

## V1 business fields → PlotMaster

| V1 Plots column | PlotMaster column |
|-----------------|-------------------|
| PlotNo | PlotNumber |
| *(generated)* | PlotID |
| AreaSqYd | AreaSqYd |
| Facing | Facing |
| Status | Status |
| Rate | RatePerSqYd |
| Owner | Owner |
| CornerPlot | CornerPlot |
| RoadWidth | RoadWidth |
| Remarks | Remarks |

No coordinates on PlotMaster.

---

## Roads migration (no closing row)

**V1:**

```
Polyline: 80.38235,16.55665; 80.38550,16.55665
```

**V2.1:**

| RoadID | Sequence | Latitude | Longitude |
|--------|----------|----------|-----------|
| RD-1 | 1 | 16.55665 | 80.38235 |
| RD-1 | 2 | 16.55665 | 80.38550 |

Do **not** duplicate the first road vertex at the end unless the source geometry is genuinely a closed loop (rare for centerlines).

---

## Migration checklist

- [ ] Create Project row with `WorkbookFormatVersion = 2.1.0` and `ProjectID`  
- [ ] Add Boundary with **closed** ring  
- [ ] Explode plot polygons to PlotGeometry with **closing row per PlotID**  
- [ ] Move business fields to PlotMaster  
- [ ] Explode amenity polygons with **closing row per AmenityID**  
- [ ] Convert road polylines to multi-row (no close)  
- [ ] Add Blocks closed rings if block parcels are modeled  
- [ ] Remove legacy Layout / Plots sheets  
- [ ] Validate via Import GIS Workbook wizard before production import  

---

## Automated upgrade (future)

Dual-format import may auto-split V1 Plots and **append closing coordinates** during upgrade. Until then, manual or script migration must append Sequence N = Sequence 1 for all polygon sheets.

---

## Reference samples

Closed-ring examples ship in:

- `SAMPLE_BOUNDARY_ROWS`
- `SAMPLE_BLOCK_ROWS`
- `SAMPLE_PLOT_GEOMETRY_ROWS`
- `SAMPLE_AMENITY_ROWS`

File: `src/services/layoutImport/workbookV21Constants.js`
