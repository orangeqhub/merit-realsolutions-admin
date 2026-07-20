export function formatPropertyStatus(status) {
  if (!status) return 'Available';
  const value = String(status).replace(/_/g, ' ').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeProperty(property = {}) {
  if (!property) return null;

  const title = property.title
    || property.propertyTitle
    || property.name
    || property.ventureName
    || 'Property';

  const location = property.location
    || [property.locality, property.city, property.state].filter(Boolean).join(', ')
    || property.address
    || '';

  const price = property.price
    || property.priceFormatted
    || (property.priceValue != null ? String(property.priceValue) : '')
    || (property.currentPrice != null ? String(property.currentPrice) : 'Price on request');

  const area = property.area
    || property.areaFormatted
    || property.builtUpArea
    || (property.totalArea ? `${property.totalArea} ${property.unit || 'Sq.Ft'}` : '');

  const image = property.image
    || property.thumbnail
    || property.bannerImage
    || property.coverImage
    || null;

  return {
    uuid: property.uuid || null,
    id: property.id || null,
    title,
    propertyType: property.propertyTypeName
      || property.propertyType
      || property.type
      || property.category
      || 'Property',
    location,
    price: price || 'Price on request',
    status: formatPropertyStatus(property.status),
    area: area || null,
    image,
  };
}
