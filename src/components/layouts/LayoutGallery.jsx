import { FiImage } from "react-icons/fi";
import ImageGrid from "../gallery/ImageGrid";
import EmptyState from "../layout/EmptyState";

export default function LayoutGallery({ images = [] }) {
  if (!images.length) {
    return (
      <EmptyState
        icon={<FiImage />}
        title="No images yet"
        description="Upload site photos to showcase this layout."
        compact
      />
    );
  }
  return <ImageGrid images={images} columns={3} masonry enableLightbox />;
}
