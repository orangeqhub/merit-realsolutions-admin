import { rectangleFromFeet } from './geoUtils.js';

export const AMENITY_TYPES = {
  park: {
    key: 'park',
    label: 'Park',
    heightFeet: 80,
    widthRatio: 1,
    fillColor: '#86efac',
    borderColor: '#16a34a',
  },
  clubHouse: {
    key: 'clubHouse',
    label: 'Club House',
    heightFeet: 70,
    widthRatio: 0.65,
    fillColor: '#fde68a',
    borderColor: '#d97706',
  },
  openSpace: {
    key: 'openSpace',
    label: 'Open Space',
    heightFeet: 55,
    widthRatio: 1,
    fillColor: '#bbf7d0',
    borderColor: '#059669',
  },
  temple: {
    key: 'temple',
    label: 'Temple',
    heightFeet: 50,
    widthRatio: 0.35,
    fillColor: '#fecaca',
    borderColor: '#dc2626',
  },
  swimmingPool: {
    key: 'swimmingPool',
    label: 'Swimming Pool',
    heightFeet: 45,
    widthRatio: 0.45,
    fillColor: '#bae6fd',
    borderColor: '#0284c7',
  },
};

export function getEnabledAmenityKeys(amenities = {}) {
  return Object.keys(AMENITY_TYPES).filter((key) => Boolean(amenities?.[key]));
}

export function getEnabledAmenityLabels(amenities = {}) {
  return getEnabledAmenityKeys(amenities).map((key) => AMENITY_TYPES[key].label);
}

/**
 * Stack amenity preview polygons vertically within an inter-block corridor.
 */
export function generateAmenityCorridor({
  amenities = {},
  blockWidthFeet,
  originLat,
  originLng,
  northFeet,
  eastFeet = 0,
  corridorId = 'corridor-0',
}) {
  const enabledKeys = getEnabledAmenityKeys(amenities);
  const items = [];
  let cursor = northFeet;

  enabledKeys.forEach((key) => {
    const def = AMENITY_TYPES[key];
    const widthFeet = blockWidthFeet * def.widthRatio;
    const eastOffset = eastFeet + (blockWidthFeet - widthFeet) / 2;
    const coordinates = rectangleFromFeet(
      originLat,
      originLng,
      cursor,
      eastOffset,
      widthFeet,
      def.heightFeet
    );

    items.push({
      id: `amenity-${corridorId}-${key}`,
      type: key,
      name: def.label,
      label: def.label,
      heightFeet: def.heightFeet,
      widthFeet,
      coordinates,
      polygonPoints: coordinates.map(({ lat, lng }) => ({ lat, lng })),
      style: {
        fillColor: def.fillColor,
        borderColor: def.borderColor,
      },
    });

    cursor += def.heightFeet;
  });

  return {
    amenities: items,
    totalHeightFeet: cursor - northFeet,
  };
}

export function estimateAmenityHeight(amenities = {}) {
  return getEnabledAmenityKeys(amenities).reduce(
    (sum, key) => sum + (AMENITY_TYPES[key]?.heightFeet || 0),
    0
  );
}
