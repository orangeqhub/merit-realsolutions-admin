import { useId, useState } from "react";
import { FiUploadCloud, FiX, FiFileText } from "react-icons/fi";
import "./Upload.css";

function toPreview(file) {
  if (!file) return null;
  if (typeof file === "string") {
    const url = file.trim().startsWith("blob:") ? "" : file;
    return { name: file.split("/").pop(), url, isImage: Boolean(url) };
  }
  const isImage = file.type?.startsWith("image/");
  return { name: file.name, url: isImage ? URL.createObjectURL(file) : null, isImage };
}

export default function Upload({
  label,
  hint = "PNG, JPG or PDF up to 5MB",
  accept = "image/*",
  multiple = false,
  value,
  onChange,
  variant = "image",
  className = "",
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const files = multiple ? value || [] : value ? [value] : [];

  const addFiles = (incoming) => {
    const selected = Array.from(incoming || []);
    if (!selected.length) return;
    onChange?.(multiple ? [...files, ...selected] : selected[0]);
  };

  const handleRemove = (index) => {
    if (multiple) onChange?.(files.filter((_, i) => i !== index));
    else onChange?.(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className={`erp-upload ${className}`.trim()}>
      {label && <span className="erp-upload__label">{label}</span>}

      <label
        htmlFor={inputId}
        className={`erp-upload__drop ${dragging ? "is-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="erp-upload__icon">
          <FiUploadCloud />
        </span>
        <span className="erp-upload__text">
          <strong>Click to upload</strong> or drag &amp; drop
        </span>
        <span className="erp-upload__hint">{hint}</span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(e.target.files)}
          className="erp-upload__input"
        />
      </label>

      {files.length > 0 && (
        <div
          className={`erp-upload__previews ${
            variant === "image" ? "erp-upload__previews--grid" : ""
          }`}
        >
          {files.map((file, index) => {
            const preview = toPreview(file);
            return (
              <div key={`${preview?.name}-${index}`} className="erp-upload__preview">
                {preview?.url ? (
                  <img src={preview.url} alt={preview.name} />
                ) : (
                  <span className="erp-upload__file-icon">
                    <FiFileText />
                  </span>
                )}
                <span className="erp-upload__preview-name">{preview?.name}</span>
                <button
                  type="button"
                  className="erp-upload__remove"
                  onClick={() => handleRemove(index)}
                  aria-label="Remove file"
                >
                  <FiX />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
