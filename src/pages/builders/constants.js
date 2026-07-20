export const BUILDER_STATUS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const EMPTY_BUILDER = {
  builderName: '',
  builderCode: '',
  logo: '',
  coverImage: '',
  description: '',
  about: '',
  contactPerson: '',
  mobile: '',
  email: '',
  website: '',
  officeAddress: '',
  operatingCitiesText: '',
  establishedYear: '',
  completedProjects: 0,
  ongoingProjects: 0,
  upcomingProjects: 0,
  reraNumber: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  metaTitle: '',
  metaDescription: '',
  status: 'ACTIVE',
};

function citiesToText(cities = []) {
  if (Array.isArray(cities)) return cities.join(', ');
  return '';
}

function textToCities(text = '') {
  return String(text)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapBuilderToForm(builder = {}) {
  return {
    builderName: builder.builderName || '',
    builderCode: builder.builderCode || '',
    logo: builder.logo || '',
    coverImage: builder.coverImage || '',
    description: builder.description || '',
    about: builder.about || '',
    contactPerson: builder.contactPerson || '',
    mobile: builder.mobile || '',
    email: builder.email || '',
    website: builder.website || '',
    officeAddress: builder.officeAddress || '',
    operatingCitiesText: citiesToText(builder.operatingCities),
    establishedYear: builder.establishedYear ?? '',
    completedProjects: builder.completedProjects ?? 0,
    ongoingProjects: builder.ongoingProjects ?? 0,
    upcomingProjects: builder.upcomingProjects ?? 0,
    reraNumber: builder.reraNumber || '',
    facebook: builder.facebook || '',
    instagram: builder.instagram || '',
    linkedin: builder.linkedin || '',
    youtube: builder.youtube || '',
    metaTitle: builder.metaTitle || '',
    metaDescription: builder.metaDescription || '',
    status: builder.status || 'ACTIVE',
  };
}

export function mapFormToPayload(form = {}) {
  return {
    builderName: form.builderName,
    description: form.description || '',
    about: form.about || '',
    contactPerson: form.contactPerson || '',
    mobile: form.mobile || '',
    email: form.email || '',
    website: form.website || '',
    officeAddress: form.officeAddress || '',
    operatingCities: textToCities(form.operatingCitiesText),
    establishedYear: form.establishedYear ? Number(form.establishedYear) : null,
    completedProjects: Number(form.completedProjects) || 0,
    ongoingProjects: Number(form.ongoingProjects) || 0,
    upcomingProjects: Number(form.upcomingProjects) || 0,
    reraNumber: form.reraNumber || '',
    facebook: form.facebook || '',
    instagram: form.instagram || '',
    linkedin: form.linkedin || '',
    youtube: form.youtube || '',
    metaTitle: form.metaTitle || '',
    metaDescription: form.metaDescription || '',
    status: form.status || 'ACTIVE',
    logo: typeof form.logo === 'string' ? form.logo : undefined,
    coverImage: typeof form.coverImage === 'string' ? form.coverImage : undefined,
  };
}

export { formatDate } from '../../utils/format';
