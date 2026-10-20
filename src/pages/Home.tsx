import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  LocateFixed,
  Clock,
  Star,
  Coins,
  Moon,
  PawPrint,
  Shuffle,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Map,
  UtensilsCrossed,
  ChevronDown,
  X,
  Flame,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import { defaultFilters } from "../lib/schema";
import type { Filters, Restaurant } from "../lib/schema";
import { searchRestaurants } from "../lib/search";
import { db } from "../lib/db";
import RestaurantCard from "../components/RestaurantCard";
import Modal from "../components/Modal";
const MapView = lazy(() => import("../components/MapView"));
const categoryIcons: Record<string, string> = {
  all: "🍽️",
  Filipino: "🍗",
  Carinderia: "🍲",
  Café: "☕",
  "Street Food": "🍢",
  Bakery: "🥐",
  Seafood: "🦐",
  "Fast Food": "🍔",
  Vegetarian: "🥬",
};
export default function Home({ mapMode = false }: { mapMode?: boolean }) {
  const { restaurants, categories, saved, toggleSave, origin, locate, toast } =
      useApp(),
    { t } = useTranslation(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
      ...defaultFilters,
      query: params.get("q") ?? "",
      category: params.get("category") ?? "all",
    })),
    [sheet, setSheet] = useState(false),
    [surprise, setSurprise] = useState<Restaurant>(),
    [view, setView] = useState(mapMode ? "map" : "list");
  useEffect(() => setView(mapMode ? "map" : "list"), [mapMode]);
  const found = useMemo(
    () => searchRestaurants(restaurants, filters, origin),
    [restaurants, filters, origin],
  );
  const patch = (part: Partial<Filters>) =>
    setFilters((f) => ({ ...f, ...part }));
  const select = useCallback(
    (r: Restaurant) => navigate(`/restaurant/${r.slug}`),
    [navigate],
  );
  const random = () => {
    if (!found.length) {
      toast(t("noSurprise"));
      return;
    }
    const pool = found.filter((r) => r.id !== surprise?.id);
    setSurprise(
      (pool.length ? pool : found)[
        Math.floor(Math.random() * (pool.length || found.length))
      ],
    );
  };
  const search = () => {
    setParams(filters.query ? { q: filters.query } : {});
    if (filters.query)
      db.searches.put({ query: filters.query, at: Date.now() }).catch(() => {});
    document.getElementById("spots")?.scrollIntoView({ behavior: "smooth" });
  };
  const activeCount =
    Number(filters.budget > 0) +
    Number(!!filters.tag) +
    Number(!!filters.payment) +
    Number(!!filters.service) +
    Number(filters.rating > 0);
  return (
    <div className="home-page">
      <section className="hero page-container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            {t("heroEyebrow")}
          </span>
          <h1>
            {t("heroTitle")}
            <br />
            <em>{t("heroAccent")}</em>
            <svg
              className="hero-squiggle"
              viewBox="0 0 310 14"
              aria-hidden="true"
            >
              <path
                d="M2 10Q150-5 306 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p>{t("heroText")}</p>
          <form
            className="search-bar"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Search size={21} />
            <input
              aria-label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
            />
            {filters.query && (
              <button
                type="button"
                className="icon-button"
                aria-label={t("reset")}
                onClick={() => patch({ query: "" })}
              >
                <X size={16} />
              </button>
            )}
            <button type="submit" className="primary search-submit">
              {t("search")}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="hero-meta">
            <span className="avatar-stack">
              <img src="/images/cafe.webp" alt="" />
              <img src="/images/filipino.webp" alt="" />
              <img src="/images/seafood.webp" alt="" />
            </span>
            <span>
              <strong>15</strong>{" "}
              {t("results", { count: 15 }).replace(/^15 /, "")}
              <small>
                <span className="green-dot" />
                {t("localFree")}
              </small>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-arch">
            <img
              src="/images/hero.webp"
              alt={t("heroImageAlt")}
              width="700"
              height="700"
              fetchPriority="high"
            />
            <div className="photo-shade" />
          </div>
          <span className="decor-spark spark-one">✳</span>
          <span className="decor-spark spark-two">✳</span>
          <div className="hero-stamp">
            <UtensilsCrossed size={23} />
            <span>
              LOCAL BITES
              <br />
              HAPPY HEARTS
            </span>
          </div>
          <div className="hero-float">
            <span className="hero-float-icon">🍗</span>
            <div>
              <small>{t("heroEyebrow").split(".")[0]}</small>
              <strong>{t("heroFloatTitle")}</strong>
              <span>
                <Star size={12} fill="currentColor" /> {t("heroFloatCaption")}
              </span>
            </div>
          </div>
          <span className="visual-note">
            Kaon ta! <span>↗</span>
          </span>
        </div>
      </section>
      <div className="sample-strip page-container">
        <span className="sample-pill">{t("sampleLabel")}</span>
        <p>{t("sampleNotice")}</p>
      </div>
      <section id="spots" className="explore-section page-container">
        <div className="category-row">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              className={`category ${filters.category === c ? "active" : ""}`}
              aria-pressed={filters.category === c}
              onClick={() => patch({ category: c })}
            >
              <span className="category-icon">{categoryIcons[c]}</span>
              <span>{t(c)}</span>
            </button>
          ))}
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("sectionEyebrow")}</span>
            <h2>{t("sectionTitle")}</h2>
            <p>{t("results", { count: found.length })}</p>
          </div>
          <div className="view-switch" aria-label={t("mapView")}>
            <button
              aria-pressed={view === "list"}
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <LayoutGrid size={16} />
              {t("list")}
            </button>
            <button
              aria-pressed={view === "map"}
              className={view === "map" ? "active" : ""}
              onClick={() => setView("map")}
            >
              <Map size={16} />
              {t("mapView")}
            </button>
          </div>
        </div>
        <div className="filter-row">
          <div className="quick-filters">
            <button
              className={origin ? "selected" : ""}
              onClick={async () => {
                await locate();
                patch({ sort: "distance" });
              }}
            >
              <LocateFixed size={14} />
              {t("nearMe")}
            </button>
            <button
              className={filters.open ? "selected" : ""}
              aria-pressed={filters.open}
              onClick={() => patch({ open: !filters.open })}
            >
              <Clock size={14} />
              {t("openNow")}
            </button>
            <button
              className={filters.sort === "rating" ? "selected" : ""}
              aria-pressed={filters.sort === "rating"}
              onClick={() =>
                patch({
                  sort: filters.sort === "rating" ? "recommended" : "rating",
                })
              }
            >
              <Star size={14} />
              {t("topRated")}
            </button>
            <button
              className={filters.budget === 1 ? "selected" : ""}
              aria-pressed={filters.budget === 1}
              onClick={() => patch({ budget: filters.budget === 1 ? 0 : 1 })}
            >
              <Coins size={14} />
              {t("budget")}
            </button>
            <button
              className={filters.tag === "late-night" ? "selected" : ""}
              onClick={() =>
                patch({ tag: filters.tag === "late-night" ? "" : "late-night" })
              }
            >
              <Moon size={14} />
              {t("lateNight")}
            </button>
            <button
              className="pet-filter"
              onClick={() =>
                patch({
                  tag: filters.tag === "pet-friendly" ? "" : "pet-friendly",
                })
              }
            >
              <PawPrint size={14} />
              {t("petFriendly")}
            </button>
            <button
              onClick={() => setSheet(true)}
              className={activeCount ? "selected" : ""}
            >
              <SlidersHorizontal size={14} />
              {t("filters")}
              {activeCount > 0 && <span>{activeCount}</span>}
            </button>
          </div>
          <button className="surprise-button" onClick={random}>
            <Shuffle size={15} />
            {t("surprise")}
          </button>
        </div>
        <div className="sort-row">
          <span className="tiny-label">
            <Flame size={13} />
            {t("recommended")}
          </span>
          <label>
            {t("sort")}
            <select
              value={filters.sort}
              onChange={(e) => patch({ sort: e.target.value })}
            >
              {["recommended", "distance", "rating", "price", "new"].map(
                (key) => (
                  <option value={key} key={key}>
                    {t(key)}
                  </option>
                ),
              )}
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
        {!found.length ? (
          <div className="empty-state">
            <span>🍽️</span>
            <h2>{t("noResults")}</h2>
            <p>{t("noResultsText")}</p>
            <button
              className="primary"
              onClick={() => setFilters(defaultFilters)}
            >
              {t("reset")}
            </button>
          </div>
        ) : (
          <div className={view === "map" ? "split-view" : ""}>
            <div className="card-grid">
              {found.map((r, i) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  saved={saved.some((s) => s.id === `favorites:${r.id}`)}
                  onSave={toggleSave}
                  origin={origin}
                  priority={i < 3}
                />
              ))}
            </div>
            {view === "map" && (
              <div className="map-panel">
                <Suspense fallback={<div className="skeleton map-skeleton" />}>
                  <MapView
                    restaurants={found}
                    origin={origin}
                    onSelect={select}
                  />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </section>
      <section className="ai-banner page-container">
        <div className="ai-banner-art">
          <Sparkles size={34} />
          <span>✦</span>
        </div>
        <div>
          <span className="eyebrow">{t("aiEyebrow")}</span>
          <h2>{t("aiBanner")}</h2>
          <p>{t("aiBannerText")}</p>
        </div>
        <Link to="/ask" className="primary">
          {t("askNow")}
          <ArrowRight size={17} />
        </Link>
        <span className="banner-decor">✳</span>
      </section>
      {sheet && (
        <Modal title={t("filters")} onClose={() => setSheet(false)}>
          <h2>{t("filters")}</h2>
          <div className="filter-fields">
            <label>
              {t("priceFilter")}
              <select
                value={filters.budget}
                onChange={(e) => patch({ budget: Number(e.target.value) })}
              >
                <option value={0}>{t("any")}</option>
                {[1, 2, 3].map((n, i) => (
                  <option key={n} value={n}>
                    {t(["under150", "150to350", "over350"][i])}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("amenities")}
              <select
                value={filters.tag}
                onChange={(e) => patch({ tag: e.target.value })}
              >
                <option value="">{t("any")}</option>
                {[
                  "family",
                  "group",
                  "date",
                  "pet-friendly",
                  "outdoor",
                  "wifi",
                  "aircon",
                  "parking",
                  "vegetarian-friendly",
                ].map((key) => (
                  <option key={key} value={key}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("service")}
              <select
                value={filters.service}
                onChange={(e) => patch({ service: e.target.value })}
              >
                <option value="">{t("any")}</option>
                {["dine-in", "takeout", "delivery"].map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("payment")}
              <select
                value={filters.payment}
                onChange={(e) => patch({ payment: e.target.value })}
              >
                <option value="">{t("any")}</option>
                {["cash", "GCash", "Maya"].map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("minRating")}
              <select
                value={filters.rating}
                onChange={(e) => patch({ rating: Number(e.target.value) })}
              >
                <option value={0}>{t("any")}</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button
              className="secondary"
              onClick={() => setFilters(defaultFilters)}
            >
              {t("reset")}
            </button>
            <button className="primary" onClick={() => setSheet(false)}>
              {t("apply")}
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {surprise && (
        <Modal title={t("fateTitle")} onClose={() => setSurprise(undefined)}>
          <div className="surprise-modal">
            <span className="eyebrow">
              <Shuffle size={15} />
              {t("fate")}
            </span>
            <h2>{t("fateTitle")}</h2>
            <RestaurantCard
              restaurant={surprise}
              saved={saved.some((s) => s.id === `favorites:${surprise.id}`)}
              onSave={toggleSave}
              origin={origin}
            />
            <Link className="primary wide" to={`/restaurant/${surprise.slug}`}>
              {t("viewDetails")}
              <ArrowRight size={17} />
            </Link>
            <button className="secondary wide" onClick={random}>
              <Shuffle size={16} />
              {t("spin")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
