import {
  generateAmenityCorridor,
  getEnabledAmenityKeys,
  getEnabledAmenityLabels,
  estimateAmenityHeight,
  AMENITY_TYPES,
} from '../AmenityGenerator.js';

export function enrichAmenityMetadata(amenity) {
  return {
    ...amenity,
    amenityName: amenity.name || amenity.label,
    displayLabel: amenity.displayLabel || amenity.label || amenity.name,
  };
}

export const AmenityGenerationService = {
  generateAmenityCorridor,
  getEnabledAmenityKeys,
  getEnabledAmenityLabels,
  estimateAmenityHeight,
  AMENITY_TYPES,
  enrichAmenityMetadata,
};
