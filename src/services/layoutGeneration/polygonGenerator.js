/**
 * Convert corner arrays into plot polygon payloads for the map layer.
 */
export function buildPlotPolygon({ plotNumber, coordinates, status = 'Available' }) {
  const polygonPoints = coordinates.map(({ lat, lng }) => ({
    lat: Number(lat),
    lng: Number(lng),
  }));

  const centroid = polygonPoints.reduce(
    (acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }),
    { lat: 0, lng: 0 }
  );

  const count = polygonPoints.length || 1;

  return {
    id: `generated-${plotNumber}`,
    plotNumber,
    coordinates: polygonPoints,
    polygonPoints,
    latitude: centroid.lat / count,
    longitude: centroid.lng / count,
    status,
    shapeType: 'POLYGON',
  };
}

export function buildPlotPolygons(plotNumbers, cornerSets, status = 'Available') {
  return plotNumbers.map((plotNumber, index) =>
    buildPlotPolygon({
      plotNumber,
      coordinates: cornerSets[index] || [],
      status,
    })
  );
}

/**
 * Flatten all corner positions for map fitBounds.
 */
export function collectAllPositions(polygons = []) {
  return polygons.flatMap((plot) =>
    (plot.polygonPoints || plot.coordinates || []).map(({ lat, lng }) => [lat, lng])
  );
}
