export const ENQUIRY_PURPOSE_OPTIONS = [
  { value: 'BUY', label: 'Buy' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'GENERAL', label: 'General Enquiry' },
];

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function normalizeMobile(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function buildEnquiryDefaults(customer, property) {
  const title = property?.title
    || property?.propertyTitle
    || property?.name
    || '';

  return {
    name: customer?.name || '',
    mobile: normalizeMobile(customer?.mobile || ''),
    alternateMobile: normalizeMobile(customer?.alternateMobile || ''),
    email: customer?.email || '',
    city: customer?.city || '',
    state: customer?.state || '',
    interestedProperty: title,
    purpose: 'BUY',
    message: '',
    additionalNotes: '',
    needSiteVisit: false,
    preferredSiteVisitDate: '',
    preferredTime: '',
  };
}

export function validateEnquiryValues(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = 'Full name is required.';
  }

  const mobile = normalizeMobile(values.mobile);
  if (!mobile) {
    errors.mobile = 'Mobile number is required.';
  } else if (!MOBILE_PATTERN.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number.';
  }

  const alternateMobile = normalizeMobile(values.alternateMobile);
  if (alternateMobile && !MOBILE_PATTERN.test(alternateMobile)) {
    errors.alternateMobile = 'Enter a valid 10-digit alternate mobile number.';
  }

  if (values.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.message?.trim()) {
    errors.message = 'Message is required.';
  } else if (values.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }

  if (values.needSiteVisit) {
    if (!values.preferredSiteVisitDate) {
      errors.preferredSiteVisitDate = 'Preferred date is required for a site visit.';
    }
    if (!values.preferredTime) {
      errors.preferredTime = 'Preferred time is required for a site visit.';
    }
  }

  return errors;
}

export function mapEnquiryPayload(values, source) {
  const mobile = normalizeMobile(values.mobile);
  const alternateMobile = normalizeMobile(values.alternateMobile);

  return {
    name: values.name.trim(),
    mobile,
    alternateMobile: alternateMobile || undefined,
    email: values.email?.trim() || undefined,
    city: values.city?.trim() || undefined,
    state: values.state?.trim() || undefined,
    message: values.message?.trim() || undefined,
    purpose: values.purpose,
    needSiteVisit: Boolean(values.needSiteVisit),
    preferredSiteVisitDate: values.needSiteVisit ? values.preferredSiteVisitDate : undefined,
    preferredTime: values.needSiteVisit ? values.preferredTime : undefined,
    additionalNotes: values.additionalNotes?.trim() || undefined,
    source: source || undefined,
  };
}
