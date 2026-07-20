import { EnquiryModal } from './index.js';
import { submitPropertyEnquiry } from '../../services/property/enquiryApi.js';
import { getMediaBaseUrl } from '../../config/api.js';

function resolveMediaUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = getMediaBaseUrl();
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export default function EnquiryFormModal({
  property,
  customer = null,
  onClose,
  onSuccess,
}) {
  if (!property?.id) return null;

  return (
    <EnquiryModal
      property={property}
      customer={customer}
      source="ADMIN"
      onClose={onClose}
      onSuccess={onSuccess}
      resolveMediaUrl={resolveMediaUrl}
      successLinks={{
        enquiriesPath: '/dashboard/property-enquiries',
        browsePath: '/dashboard/properties/list',
      }}
      onSubmit={(payload) => submitPropertyEnquiry(property.id, payload)}
    />
  );
}
