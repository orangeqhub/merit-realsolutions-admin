import { useMemo, useState } from 'react';
import { isUsableMediaUrl, resolveMediaUrl } from '../../utils/media';

export default function MediaImage({
  src,
  fallback = '',
  alt = '',
  className = '',
  placeholderClassName = 'media-image__placeholder',
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveMediaUrl(src), [src]);
  const imageSrc = useMemo(() => {
    if (isUsableMediaUrl(resolved) && !failed) return resolved;
    return isUsableMediaUrl(fallback) ? resolveMediaUrl(fallback) : '';
  }, [resolved, fallback, failed]);

  if (!imageSrc) {
    return <div className={`${placeholderClassName} ${className}`.trim()} aria-hidden="true" />;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
