import { Heart, MapPin, Star, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Restaurant, Coordinates } from "../lib/schema";
import { cityCenter, distanceKm, isOpen } from "../lib/search";
export default function RestaurantCard({
  restaurant: r,
  saved,
  onSave,
  origin,
  priority = false,
}: {
  restaurant: Restaurant;
  saved: boolean;
  onSave: (id: string) => void;
  origin?: Coordinates;
  priority?: boolean;
}) {
  const { t } = useTranslation();
  const open = isOpen(r);
  return (
    <article className="restaurant-card" data-testid="restaurant-card">
      <div className="card-photo">
        <Link to={`/restaurant/${r.slug}`} tabIndex={-1} aria-hidden="true">
          <img
            src={r.photos[0]}
            alt={r.signatureDishes[0]}
            width="600"
            height="420"
            loading={priority ? "eager" : "lazy"}
          />
        </Link>
        <span className={`open-badge ${open ? "" : "is-closed"}`}>
          <i />
          {t(open ? "open" : "closed")}
        </span>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={() => onSave(r.id)}
          aria-label={t(saved ? "unsave" : "save", { name: r.name })}
          aria-pressed={saved}
        >
          <Heart size={19} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className="photo-caption">
          {t(r.categories[0])}
          <span>·</span>
          {"₱".repeat(r.priceLevel)}
        </span>
        <span className="sample-photo">{t("sampleShort")}</span>
      </div>
      <div className="card-info">
        <div className="card-title-row">
          <h3>
            <Link to={`/restaurant/${r.slug}`}>{r.name}</Link>
          </h3>
          <span className="card-rating" title={t("sampleRating")}>
            <Star size={14} fill="currentColor" />
            {r.rating.toFixed(1)}
            <small>({r.reviewCount})</small>
          </span>
        </div>
        <p className="card-address">
          <MapPin size={13} />
          {r.barangay} <span>·</span>{" "}
          {distanceKm(r, origin ?? cityCenter).toFixed(1)} km{" "}
          {t(origin ? "fromYou" : "fromCenter")}
        </p>
        <div className="card-bottom">
          <div className="card-tags">
            {r.tags.slice(0, 2).map((tag) => (
              <span key={tag}>{t(tag)}</span>
            ))}
          </div>
          <Link
            to={`/restaurant/${r.slug}`}
            className="card-arrow"
            aria-label={`${t("viewDetails")}: ${r.name}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
