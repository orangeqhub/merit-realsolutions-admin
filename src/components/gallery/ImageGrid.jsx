import { useState } from "react";
import { motion } from "framer-motion";
import { FiMaximize2 } from "react-icons/fi";
import Lightbox from "./Lightbox";
import "./ImageGrid.css";

function srcOf(image) {
  return typeof image === "string" ? image : image?.src;
}
function altOf(image, i) {
  return typeof image === "string" ? `Image ${i + 1}` : image?.alt || `Image ${i + 1}`;
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

  const limited =
    maxVisible && images.length > maxVisible ? images.slice(0, maxVisible) : images;
  const remaining = maxVisible ? images.length - limited.length : 0;

  const open = (i) => enableLightbox && setActiveIndex(i);

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
              key={i}
              className="image-grid__item"
              onClick={() => open(i)}
              whileHover={{ scale: enableLightbox ? 1.01 : 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={srcOf(image)} alt={altOf(image, i)} loading="lazy" />
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
          images={images}
          index={activeIndex}
          onChange={setActiveIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  );
}
