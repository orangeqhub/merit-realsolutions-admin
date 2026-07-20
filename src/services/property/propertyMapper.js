import { getMediaBaseUrl } from '../../config/api.js';

export function resolveMediaPath(filePath) {
  if (!filePath) return '';
  if (
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('blob:') ||
    filePath.startsWith('data:')
  ) {
    return filePath;
  }
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const mediaBase = getMediaBaseUrl();
  return mediaBase ? `${mediaBase}${path}` : path;
}

function mediaPathOrEmpty(value) {
  return typeof value === 'string' ? value : '';
}

const STATUS_TO_API = {
  Available: 'AVAILABLE',
  Booked: 'RESERVED',
  Sold: 'SOLD',
  Reserved: 'RESERVED',
  Inactive: 'INACTIVE',
};

const STATUS_FROM_API = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  INACTIVE: 'Inactive',
};

export function resolvePropertyAssignee(property = {}) {
  return property.assignee
    || property.assignedUser
    || property.assignment?.assignee
    || property.assignedPartner
    || null;
}

export function resolvePropertyAssignments(property = {}) {
  if (Array.isArray(property.assignments) && property.assignments.length) {
    return property.assignments;
  }
  if (property.assignment?.assigneeUserId || property.assignment?.assignee) {
    return [property.assignment];
  }
  const assignee = resolvePropertyAssignee(property);
  if (assignee || property.assigneeUserId) {
    return [{
      assigneeUserId: property.assigneeUserId || assignee?.id || null,
      assignee,
      assignedAt: property.assignment?.assignedAt || null,
      assignedByUser: property.assignment?.assignedByUser || null,
      status: property.assignment?.status || assignee?.status || 'Active',
    }];
  }
  return [];
}

export function mapAdminFormToApi(form = {}, options = {}) {
  const price = Number(form.finalPrice || 0);
  const totalArea = form.area ? Number(form.area) : null;
  const explicitPricePerSqFt = form.pricePerSqFt ? Number(form.pricePerSqFt) : null;
  const derivedPricePerSqFt =
    !explicitPricePerSqFt && price > 0 && totalArea > 0
      ? Number((price / totalArea).toFixed(2))
      : null;

  const specificationValues = Object.entries(form.specificationValues || {})
    .filter(([, value]) => String(value || '').trim())
    .map(([specificationId, value]) => ({
      specificationId: Number(specificationId),
      value: String(value).trim(),
    }));

  const payload = {
    propertyTitle: form.name,
    propertyTypeId: form.propertyTypeId ? Number(form.propertyTypeId) : null,
    propertyListedBy: form.propertyListedBy || null,
    description: form.description || '',
    shortDescription: form.shortDescription || form.name || '',
    state: form.state,
    district: form.district,
    city: form.city,
    locality: form.locality || form.city,
    address: form.address || '',
    pincode: form.pincode || '',
    price,
    negotiable: Boolean(form.negotiable),
    registrationCharges: form.registrationCharges ? Number(form.registrationCharges) : null,
    maintenanceCharges: form.maintenanceCharges ? Number(form.maintenanceCharges) : null,
    unit: form.unit || 'Sq.Ft',
    facing: form.facing || '',
    thumbnail: mediaPathOrEmpty(form.thumbnail),
    bannerImage: mediaPathOrEmpty(form.banner),
    galleryImages: Array.isArray(form.gallery)
      ? form.gallery.filter((item) => typeof item === 'string' && item.trim())
      : [],
    documents: Array.isArray(form.documents)
      ? form.documents.filter((item) => item && typeof item === 'object' && !(item instanceof File) && item.url)
      : [],
    specificationValues,
    amenityIds: Array.isArray(form.amenityIds)
      ? form.amenityIds.map((id) => Number(id)).filter(Boolean)
      : [],
    status: STATUS_TO_API[form.status] || 'AVAILABLE',
    isPublished: options.isPublished ?? Boolean(form.isPublished),
    featuredProperty: Boolean(form.featuredProperty),
  };

  const latitude = Number(form.location?.latitude);
  const longitude = Number(form.location?.longitude);
  if (!Number.isNaN(latitude)) payload.latitude = latitude;
  if (!Number.isNaN(longitude)) payload.longitude = longitude;
  if (totalArea != null) payload.totalArea = totalArea;
  if (explicitPricePerSqFt || derivedPricePerSqFt) {
    payload.pricePerSqFt = explicitPricePerSqFt || derivedPricePerSqFt;
  }
  if (form.builtUpArea) payload.builtUpArea = Number(form.builtUpArea);
  if (form.bedrooms) payload.bedrooms = Number(form.bedrooms);
  if (form.bathrooms) payload.bathrooms = Number(form.bathrooms);
  if (form.parking) payload.parking = Number(form.parking);
  if (form.furnishing) payload.furnishing = form.furnishing;
  if (form.location?.mapUrl) payload.googleMapsUrl = form.location.mapUrl;
  if (form.propertyListedBy === 'BUILDER_DEVELOPER') {
    payload.builderId = form.builderId ? Number(form.builderId) : null;
    payload.listedByName = null;
  } else {
    payload.builderId = null;
    const name = form.listedByName?.trim();
    payload.listedByName = name || null;
  }
  if (form.assigneeUserId) payload.assigneeUserId = Number(form.assigneeUserId);
  else if (form.assigneeUserId === '' || form.assigneeUserId === null) {
    payload.assigneeUserId = null;
  }

  return payload;
}

export function mapApiPropertyToAdmin(property = {}) {
  const specificationValues = {};
  (property.specifications || []).forEach((item) => {
    if (item.specificationId) {
      specificationValues[item.specificationId] = item.value || '';
    }
  });

  const assignee = resolvePropertyAssignee(property);
  const assignments = resolvePropertyAssignments({ ...property, assignee });

  return {
    id: property.id,
    uuid: property.uuid,
    name: property.propertyTitle,
    code: property.propertyCode,
    propertyTypeId: property.propertyTypeId || '',
    propertyCategory: property.propertyType || property.typeDefinition?.category || '',
    propertyTypeName: property.category || property.typeDefinition?.name || '',
    status: STATUS_FROM_API[property.status] || 'Available',
    city: property.city,
    district: property.district,
    state: property.state,
    locality: property.locality,
    address: property.address || '',
    pincode: property.pincode || '',
    area: property.totalArea,
    unit: property.unit,
    facing: property.facing,
    furnishing: property.furnishing || '',
    pricePerSqFt: property.pricePerSqFt || '',
    bedrooms: property.bedrooms || '',
    bathrooms: property.bathrooms || '',
    builtUpArea: property.builtUpArea || '',
    negotiable: Boolean(property.negotiable),
    registrationCharges: property.registrationCharges || '',
    maintenanceCharges: property.maintenanceCharges || '',
    finalPrice: Number(property.price),
    thumbnail: resolveMediaPath(property.thumbnail),
    banner: resolveMediaPath(property.bannerImage),
    gallery: (property.galleryImages || []).map(resolveMediaPath).filter(Boolean),
    documents: (property.documents || []).map((doc) => ({
      ...doc,
      url: resolveMediaPath(doc.url),
    })),
    specificationValues,
    specifications: property.specifications || [],
    amenityIds: property.amenityIds || (property.amenityItems || []).map((item) => item.id),
    amenityList: property.amenities || [],
    builderId: property.builderId || property.builder?.id || '',
    builder: property.builder || null,
    propertyListedBy: property.propertyListedBy || (property.builderId ? 'BUILDER_DEVELOPER' : 'INDIVIDUAL_OWNER'),
    listedByName: property.listedByName || '',
    listedByLabel: property.listedByLabel || '',
    listedByDetail: property.listedByDetail || '',
    listedByDisplay: property.listedByDisplay || '',
    listedByListValue: property.listedByListValue || '',
    assigneeUserId: property.assigneeUserId || property.assignment?.assigneeUserId || assignee?.id || property.assignedPartnerId || '',
    assignee,
    assignedPartnerId: property.assigneeUserId || property.assignment?.assigneeUserId || assignee?.id || property.assignedPartnerId || '',
    assignedPartner: assignee,
    assignment: property.assignment || assignments[0] || null,
    assignments,
    isPublished: property.isPublished,
    featuredProperty: property.featuredProperty,
    createdDate: property.createdAt,
    lastUpdated: property.updatedAt,
    description: property.description,
    shortDescription: property.shortDescription,
    location: {
      latitude: property.latitude,
      longitude: property.longitude,
      mapUrl: property.googleMapsUrl || '',
    },
  };
}
