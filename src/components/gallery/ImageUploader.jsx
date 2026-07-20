import Upload from "../ui/upload/Upload";

export default function ImageUploader({
  label = "Gallery",
  hint = "Upload multiple images (PNG, JPG up to 5MB each)",
  value,
  onChange,
  multiple = true,
  className = "",
}) {
  return (
    <Upload
      label={label}
      hint={hint}
      accept="image/*"
      multiple={multiple}
      variant="image"
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}
