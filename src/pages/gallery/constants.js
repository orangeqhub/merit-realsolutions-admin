export const GALLERY_STATUS = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
];

export const EMPTY_GALLERY = {
  title: '',
  categoryId: '',
  description: '',
  coverImage: '',
  images: [],
  existingImages: [],
  videos: [],
  existingVideos: [],
  displayOrder: 0,
  status: 'DRAFT',
};

export function mapGalleryToForm(gallery = {}) {
  const imageUrls = (gallery.media || [])
    .filter((m) => m.mediaType === 'IMAGE')
    .map((m) => m.imageUrl)
    .filter(Boolean);
  const videoUrls = (gallery.media || [])
    .filter((m) => m.mediaType === 'VIDEO')
    .map((m) => m.videoUrl)
    .filter(Boolean);

  return {
    title: gallery.title || '',
    categoryId: gallery.categoryId ? String(gallery.categoryId) : '',
    description: gallery.description || '',
    coverImage: gallery.coverImage || '',
    images: [],
    existingImages: imageUrls,
    videos: [],
    existingVideos: videoUrls,
    displayOrder: gallery.displayOrder ?? 0,
    status: gallery.status || 'DRAFT',
  };
}

export function mapFormToPayload(form = {}) {
  return {
    title: form.title,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    description: form.description || '',
    coverImage: typeof form.coverImage === 'string' ? form.coverImage : undefined,
    existingImages: form.existingImages || [],
    existingVideos: form.existingVideos || [],
    displayOrder: Number(form.displayOrder) || 0,
    status: form.status || 'DRAFT',
  };
}

export { formatDate } from '../../utils/format';
