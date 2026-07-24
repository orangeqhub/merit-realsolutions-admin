import { FiMapPin, FiEdit2, FiShare2, FiFileText } from 'react-icons/fi';
import Badge from '../ui/badge/Badge';
import Button from '../ui/button/Button';
import MediaImage from './MediaImage';
import { getVentureBannerUrl, getAvatarFallback } from '../../utils/media';
import './VentureHeader.css';

export default function VentureHeader({ venture, onEdit, onShare, onDocuments }) {
  const location = [venture.city, venture.district, venture.state].filter(Boolean).join(', ');
  const bannerUrl = getVentureBannerUrl(venture);

  return (
    <section className="venture-header">
      <div className="venture-header__banner">
        <MediaImage
          src={bannerUrl}
          alt=""
          className="venture-header__banner-image"
          placeholderClassName="venture-header__banner-placeholder"
        />
        <div className="venture-header__overlay" />
      </div>

      <div className="venture-header__content">
        <div className="venture-header__profile">
          <MediaImage
            src={venture.logo || venture.thumbnail}
            fallback={getAvatarFallback(venture.name)}
            alt=""
            className="venture-header__logo"
          />
          <div className="venture-header__text">
            <div className="venture-header__badges">
              <Badge status={venture.status} dot />
              <span className="venture-header__type">{venture.propertyType}</span>
            </div>
            <h1 className="venture-header__title">{venture.name}</h1>
            <p className="venture-header__meta">
              <FiMapPin /> {location}
              <span>·</span>
              {venture.developer}
            </p>
          </div>
        </div>

        <div className="venture-header__actions">
          <Button variant="ghost" size="md" onClick={onEdit}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="ghost" size="md" onClick={onShare}>
            <FiShare2 /> Share
          </Button>
          <Button variant="accent" size="md" onClick={onDocuments}>
            <FiFileText /> Documents
          </Button>
        </div>
      </div>
    </section>
  );
}
