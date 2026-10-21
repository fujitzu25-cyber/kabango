import PlacePhoto from "../components/PlacePhoto";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Share2,
  MapPin,
  Clock,
  Star,
  Phone,
  Globe,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Store,
  Check,
  Bookmark,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import { isOpen } from "../lib/search";
import { db, localRatings } from "../lib/db";
import type { Review } from "../lib/db";
import type { Language } from "../lib/schema";
const MapView = lazy(() => import("../components/MapView"));
export default function Detail() {
  const { slug } = useParams(),
    { restaurants, saved, toggleSave, toast } = useApp(),
    { t, i18n } = useTranslation(),
    r = restaurants.find((item) => item.slug === slug);
  const [photo, setPhoto] = useState(0),
    [reviews, setReviews] = useState<Review[]>([]),
    [rating, setRating] = useState(5),
    [text, setText] = useState(""),
    [file, setFile] = useState<File>(),
    [honey, setHoney] = useState(""),
    [ownRating, setOwnRating] = useState({ rating: 0, count: 0 });
  useEffect(() => {
    if (!r) return;
    document.title = `${r.name} · KabanGo`;
    db.reviews.where("restaurantId").equals(r.id).toArray().then(setReviews);
    localRatings.get(r.id).then(setOwnRating);
  }, [r]);
  if (!r)
    return (
      <div className="page-container empty-state">
        <h1>{t("notFound")}</h1>
        <Link to="/" className="primary">
          {t("back")}
        </Link>
      </div>
    );
  const favorite = saved.some((s) => s.id === `favorites:${r.id}`),
    want = saved.some((s) => s.id === `want:${r.id}`),
    open = isOpen(r),
    url = `${window.location.origin}/restaurant/${r.slug}`;
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast(t("copied"));
    } catch {
      toast(t("shareFailed"));
    }
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: r!.name, url });
      else await copy(url);
    } catch {
      /* User dismissed the native share sheet. */
    }
  }
  async function addReview(event: React.FormEvent) {
    event.preventDefault();
    if (!r || honey) return;
    const last = reviews.reduce((n, item) => Math.max(n, item.createdAt), 0);
    if (
      Date.now() - last < 60000 ||
      text.trim().length < 10 ||
      text.trim().length > 1000
    ) {
      toast(t("reviewSpam"));
      return;
    }
    if (file && (file.size > 2097152 || !file.type.startsWith("image/"))) {
      toast(t("reviewTooLarge"));
      return;
    }
    const item: Review = {
      id: crypto.randomUUID(),
      restaurantId: r.id,
      rating,
      text: text.trim(),
      photo: file,
      createdAt: Date.now(),
      moderation: "pending",
    };
    await db.reviews.add(item);
    setReviews([...reviews, item]);
    setOwnRating(await localRatings.get(r.id));
    setText("");
    setFile(undefined);
    toast(t("reviewSaved"));
  }
  return (
    <div className="page-container detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        {t("back")}
      </Link>
      <div className="gallery">
        <PlacePhoto key={r.id + photo} restaurant={r} index={photo} priority />
        <div className="gallery-gradient" />
        <span className="gallery-category">
          {t(r.categories[0])} ·{" "}
          {r.priceLevel ? "₱".repeat(r.priceLevel) : t("priceUnknown")}
        </span>
        <div className="gallery-actions">
          <button
            className="save-button"
            onClick={share}
            aria-label={t("share")}
          >
            <Share2 size={20} />
          </button>
          <button
            className={`save-button ${favorite ? "is-saved" : ""}`}
            aria-pressed={favorite}
            onClick={() => toggleSave(r.id)}
            aria-label={t(favorite ? "unsave" : "save", { name: r.name })}
          >
            <Heart size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        {r.photos.length > 1 && (
          <div className="gallery-controls">
            <button
              className="save-button"
              aria-label={t("previousPhoto")}
              onClick={() =>
                setPhoto((photo + r.photos.length - 1) % r.photos.length)
              }
            >
              <ChevronLeft size={20} />
            </button>
            <span>
              {photo + 1} / {r.photos.length}
            </span>
            <button
              className="save-button"
              aria-label={t("nextPhoto")}
              onClick={() => setPhoto((photo + 1) % r.photos.length)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">
            {t(r.sample ? "sample" : "sourcedListing")}
          </span>
          <h1>{r.name}</h1>
          <p>
            <MapPin size={16} />
            {r.barangay} · {r.landmark}
            {r.reviewCount > 0 && (
              <span className="card-rating" title={t("sampleRating")}>
                <Star size={15} fill="currentColor" />
                {r.rating.toFixed(1)}{" "}
                <small>
                  ({r.reviewCount} · {t("sampleShort")})
                </small>
              </span>
            )}
          </p>
        </div>
        <span
          className={`status-pill ${open === null ? "is-unknown" : open ? "" : "is-closed"}`}
        >
          <i />
          {open === null ? t("hoursUnknown") : t(open ? "open" : "closed")}
        </span>
      </div>
      <div className="sample-detail">
        <Flag size={17} />
        {t(r.sample ? "sampleDetail" : "sourceDetail")}
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-actions">
            {r.lat !== null && r.lng !== null ? (
              <Link to={`/fare?to=${r.id}&trip=1`} className="primary">
                <Navigation size={18} />
                {t("directions")}
              </Link>
            ) : (
              <a
                className="primary"
                href={r.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation size={18} />
                {t("searchLocation")}
              </a>
            )}
            {r.phone && (
              <a className="secondary" href={`tel:${r.phone}`}>
                <Phone size={17} />
                {t("call")}
              </a>
            )}
            {r.website && (
              <a
                className="secondary"
                href={r.website}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={17} />
                {t("website")}
              </a>
            )}
            <button
              className={`secondary ${want ? "selected" : ""}`}
              aria-pressed={want}
              onClick={() => toggleSave(r.id, "want")}
            >
              <Bookmark size={17} />
              {t("want")}
            </button>
          </div>
          <section className="detail-section">
            <h2>{t("about")}</h2>
            <p>{r.description}</p>
            <div className="detail-tags">
              {[...r.tags, ...r.services, ...r.payments].map((tag) => (
                <span key={tag}>
                  <Check size={13} />
                  {t(tag)}
                </span>
              ))}
            </div>
            <p className="muted small">
              {r.maxGroupSize
                ? t("groupSize", { count: r.maxGroupSize })
                : t("capacityUnknown")}
            </p>
          </section>
          <section className="detail-section" id="menu">
            <div className="section-title">
              <h2>{t("menu")}</h2>
              {r.sample && (
                <span className="sample-pill">{t("sampleShort")}</span>
              )}
            </div>
            {r.menuUrl && (
              <a
                className="secondary"
                href={r.menuUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={16} />
                {t("publishedMenu")}
              </a>
            )}
            {!r.menu.length && <p className="muted">{t("menuUnknown")}</p>}
            <div className="menu-list">
              {r.menu.map((item, i) => (
                <div key={item.name}>
                  <span className="menu-number">0{i + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                  </div>
                  <strong className="menu-price">₱{item.price}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section source-section">
            <h2>{t("photosAndSources")}</h2>
            {r.photoCredit && (
              <p className="muted">
                {r.photoCredit}{" "}
                <a href={r.photoSourceUrl} target="_blank" rel="noreferrer">
                  {t("originalPhoto")}
                </a>
              </p>
            )}
            {r.facebookUrl && (
              <a
                className="secondary"
                href={r.facebookPostUrl ?? r.facebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={16} />
                {t("officialPosts")}
              </a>
            )}
            <p className="small muted">{t("sourcePolicy")}</p>
            <ul className="source-list">
              {r.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title} ↗
                  </a>
                  <small>
                    {source.kind} · {t("checked")} {source.checkedAt}
                  </small>
                  <p>{source.note}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="detail-section">
            <h2>
              {t("reviews")}{" "}
              {ownRating.count > 0 && (
                <span className="own-rating">
                  <Star size={16} />
                  {ownRating.rating.toFixed(1)} ({ownRating.count})
                </span>
              )}
            </h2>
            <p className="muted small">{t("reviewsNote")}</p>
            {reviews.length ? (
              reviews.map((review) => (
                <div className="review" key={review.id}>
                  <span className="review-stars">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  <p>{review.text}</p>
                  {review.photo && <ReviewPhoto blob={review.photo} />}
                  <small>{t("pending")}</small>
                </div>
              ))
            ) : (
              <p className="muted">{t("noReviews")}</p>
            )}
            <form className="review-form" onSubmit={addReview}>
              <h3>{t("writeReview")}</h3>
              <label>
                {t("reviewRating")}
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("reviewText")}
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                />
              </label>
              <label>
                {t("reviewPhoto")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                />
              </label>
              <input
                tabIndex={-1}
                autoComplete="off"
                className="honeypot"
                aria-hidden="true"
                aria-label={t("honeypot")}
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
              />
              <button className="secondary" type="submit">
                {t("submitReview")}
              </button>
            </form>
          </section>
        </div>
        <aside className="detail-aside">
          <section className="info-panel">
            <h2>
              <Clock size={18} />
              {t("hours")}
            </h2>
            {!r.hours.length && (
              <p className="muted">
                {t("hoursUnknown")}. {r.hoursText ?? t("confirmHours")}
              </p>
            )}
            <div className="hours-list">
              {r.hours.map((day, i) => (
                <div key={i}>
                  <span>
                    {(t("days", { returnObjects: true }) as string[])[i]}
                  </span>
                  <strong>
                    {day.length
                      ? day.map(([s, e]) => `${s}–${e}`).join(", ")
                      : t("closedDay")}
                  </strong>
                </div>
              ))}
            </div>
          </section>
          <section className="info-panel">
            <h2>
              <MapPin size={18} />
              {t("address")}
            </h2>
            <p>{r.address}</p>
            <button className="text-button" onClick={() => copy(r.address)}>
              <Copy size={14} />
              {t("copyAddress")}
            </button>
            <Suspense fallback={<div className="skeleton map-skeleton" />}>
              {r.lat !== null && r.lng !== null ? (
                <MapView restaurants={[r]} compact />
              ) : (
                <p className="muted">{t("mapUnconfirmed")}</p>
              )}
            </Suspense>
            <p className="small muted">
              {r.directions[i18n.language as Language] ?? r.directions.en}
            </p>
            <a
              href={r.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-button"
            >
              {t("searchMaps")}
              <ArrowRight size={14} />
            </a>
            {r.facebookUrl && (
              <a
                href={r.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="text-button"
              >
                {t("facebook")}
              </a>
            )}
            {!r.phone && !r.website && (
              <p className="small muted">{t("contactsMissing")}</p>
            )}
          </section>
          <section className="info-panel qr-panel">
            <QRCodeSVG
              value={url}
              size={112}
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#28221f"
            />
            <div>
              <h3>{t("qr")}</h3>
              <button className="text-button" onClick={share}>
                <Share2 size={14} />
                {t("share")}
              </button>
            </div>
          </section>
          <div className="owner-links">
            <Link
              to={`/community?kind=report&name=${encodeURIComponent(r.name)}`}
            >
              <Flag size={15} />
              {t("report")}
            </Link>
            <Link
              to={`/community?kind=claim&name=${encodeURIComponent(r.name)}`}
            >
              <Store size={15} />
              {t("claim")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ReviewPhoto({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return (
    <img
      className="review-photo"
      src={url}
      alt="Locally saved review attachment"
    />
  );
}
