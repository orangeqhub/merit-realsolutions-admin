import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getGalleryImageSrc } from "../../utils/media";
import "./Lightbox.css";

function altOf(image) {
  return typeof image === "string" ? "" : image?.alt || "";
}

export default function Lightbox({ images = [], index = 0, onClose, onChange }) {
  const open = index !== null && index >= 0;

  const go = useCallback(
    (next) => {
      if (!images.length) return;
      const total = images.length;
      onChange?.((next + total) % total);
    },
    [images.length, onChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, index, go, onClose]);

  const current = images[index];

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--prev"
              onClick={(e) => {
                e.stopPropagation();
                go(index - 1);
              }}
              aria-label="Previous image"
            >
              <FiChevronLeft />
            </button>
          )}

          <motion.img
            key={index}
            src={getGalleryImageSrc(current)}
            alt={altOf(current)}
            className="lightbox__image"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox__nav lightbox__nav--next"
              onClick={(e) => {
                e.stopPropagation();
                go(index + 1);
              }}
              aria-label="Next image"
            >
              <FiChevronRight />
            </button>
          )}

          {images.length > 1 && (
            <span className="lightbox__counter">
              {index + 1} / {images.length}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
