export const CONTENT_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const CUSTOMER_TYPES = [
  { value: 'BUYER', label: 'Buyer' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'INVESTOR', label: 'Investor' },
  { value: 'BUILDER', label: 'Builder' },
  { value: 'PARTNER', label: 'Partner' },
];

export const EMPTY_ABOUT = {
  companyImage: '',
  smallHeading: '',
  mainHeading: '',
  descriptionParagraph1: '',
  descriptionParagraph2: '',
  descriptionParagraph3: '',
  experienceNumber: '15',
  experienceSuffix: '+',
  experienceLabel: 'Years of Excellence',
  status: 'ACTIVE',
};

export const EMPTY_STATISTIC = {
  icon: '',
  number: '',
  suffix: '+',
  title: '',
  description: '',
  displayOrder: 0,
  status: 'ACTIVE',
  websiteVisible: true,
};

export const EMPTY_TESTIMONIAL = {
  customerImage: '',
  customerName: '',
  city: '',
  state: '',
  rating: 5,
  customerType: 'BUYER',
  testimonial: '',
  propertyPurchased: '',
  displayOrder: 0,
  featured: false,
  status: 'ACTIVE',
  websiteVisible: true,
};

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function mapAboutToForm(data = {}) {
  return {
    ...EMPTY_ABOUT,
    ...data,
    companyImage: data.companyImage || '',
  };
}

export function mapStatisticToForm(data = {}) {
  return { ...EMPTY_STATISTIC, ...data, websiteVisible: data.websiteVisible !== false };
}

export function mapTestimonialToForm(data = {}) {
  return {
    ...EMPTY_TESTIMONIAL,
    ...data,
    customerImage: data.customerImage || '',
    featured: Boolean(data.featured),
    websiteVisible: data.websiteVisible !== false,
  };
}
