import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiImage, FiMaximize2 } from "react-icons/fi";
import Lightbox from "./Lightbox";
import { getGalleryImageSrc } from "../../utils/media";
import "./ImageGrid.css";

function altOf(image, i) {
  return typeof image === "string" ? `Image ${i + 1}` : image?.alt || `Image ${i + 1}`;
}

function GridImage({ image, index, placeholderClassName = "image-grid__placeholder" }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => getGalleryImageSrc(image), [image]);

  if (!src || failed) {
    return (
      <div className={placeholderClassName} aria-hidden="true">
        <FiImage />
        <span>Unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={altOf(image, index)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function ImageGrid({
  images = [],
  columns = 3,
  masonry = false,
  maxVisible,
  enableLightbox = true,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const displayImages = useMemo(
    () => images.filter((image) => getGalleryImageSrc(image)),
    [images]
  );

  const limited =
    maxVisible && displayImages.length > maxVisible
      ? displayImages.slice(0, maxVisible)
      : displayImages;
  const remaining = maxVisible ? displayImages.length - limited.length : 0;

  const open = (i) => enableLightbox && setActiveIndex(i);

  if (!displayImages.length) {
    return null;
  }

  return (
    <>
      <div
        className={`image-grid ${masonry ? "image-grid--masonry" : ""} image-grid--cols-${columns} ${className}`.trim()}
      >
        {limited.map((image, i) => {
          const isLastWithMore = remaining > 0 && i === limited.length - 1;
          return (
            <motion.button
              type="button"
              key={`${getGalleryImageSrc(image)}-${i}`}
              className="image-grid__item"
              onClick={() => open(i)}
              whileHover={{ scale: enableLightbox ? 1.01 : 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <GridImage image={image} index={i} />
              {enableLightbox && !isLastWithMore && (
                <span className="image-grid__overlay">
                  <FiMaximize2 />
                </span>
              )}
              {isLastWithMore && (
                <span className="image-grid__more">+{remaining}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {enableLightbox && (
        <Lightbox
          images={displayImages}
          index={activeIndex}
          onChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
