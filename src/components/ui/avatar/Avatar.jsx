import { useState } from "react";
import "./Avatar.css";

function initialsFromName(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  status,
  className = "",
}) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <span
      className={`erp-avatar erp-avatar--${size} erp-avatar--${shape} ${className}`.trim()}
      title={name}
    >
      {showImage ? (
        <img src={src} alt={name} onError={() => setErrored(true)} />
      ) : (
        <span className="erp-avatar__initials">{initialsFromName(name) || "?"}</span>
      )}
      {status && <span className={`erp-avatar__status erp-avatar__status--${status}`} />}
    </span>
  );
}
