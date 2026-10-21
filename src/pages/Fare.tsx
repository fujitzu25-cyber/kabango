import type { Restaurant, Coordinates } from "../lib/schema";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Bus,
  LocateFixed,
  MapPin,
  Navigation,
  Info,
  Ticket,
  Fuel,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import { cityCenter } from "../lib/search";
import { estimateFare } from "../lib/fares";
import { offlineRoute, osrmProvider } from "../lib/routing";
import type { RouteResult } from "../lib/routing";
import { tariffSchema, lookupTariff } from "../lib/tariffs";
import type { TariffData } from "../lib/tariffs";
const MapView = lazy(() => import("../components/MapView"));
export default function Fare() {
  const [params] = useSearchParams(),
    [tab, setTab] = useState(params.has("trip") ? "trip" : "tariff"),
    { t } = useTranslation();
  return (
    <div className="page-container subpage fare-page">
      <span className="eyebrow">
        <Bus size={15} />
        {t("fare")}
      </span>
      <h1>{t("fareTitle")}</h1>
      <p className="page-intro">{t("fareText")}</p>
      <div className="tabs">
        <button
          onClick={() => setTab("tariff")}
          className={tab === "tariff" ? "active" : ""}
        >
          {t("tariffTab")}
        </button>
        <button
          onClick={() => setTab("trip")}
          className={tab === "trip" ? "active" : ""}
        >
          {t("tripTab")}
        </button>
      </div>
      {tab === "tariff" ? <TariffGuide /> : <TripEstimate />}
    </div>
  );
}
function TariffGuide() {
  const { t } = useTranslation(),
    [data, setData] = useState<TariffData>(),
    [error, setError] = useState(false),
    [area, setArea] = useState(""),
    [from, setFrom] = useState(""),
    [routeId, setRouteId] = useState(""),
    [band, setBand] = useState(""),
    [passenger, setPassenger] = useState("regular");
  useEffect(() => {
    fetch("/data/tricycle-tariffs.json")
      .then((r) => r.json())
      .then((v) => setData(tariffSchema.parse(v)))
      .catch(() => setError(true));
  }, []);
  if (error) return <div className="empty-state">{t("error")}</div>;
  if (!data) return <div className="skeleton skeleton-card" />;
  const areas = [...new Set(data.routes.map((r) => r.area))],
    routes = data.routes.filter((r) => !area || r.area === area),
    origins = [...new Set(routes.map((r) => r.from))],
    destinations = routes.filter((r) => r.from === from),
    selected = data.routes.find((r) => r.id === routeId),
    amount = lookupTariff(data, routeId, band, passenger !== "regular");
  return (
    <div className="tariff-layout">
      <section className="form-panel">
        <div className="section-title">
          <h2>
            <Ticket size={20} />
            {t("tariffTitle")}
          </h2>
          <span className="sample-pill">2026-006</span>
        </div>
        <p className="muted small">{t("tariffIntro")}</p>
        <div className="filter-fields">
          <label>
            {t("routeArea")}
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setFrom("");
                setRouteId("");
              }}
            >
              <option value="">{t("allAreas")}</option>
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label>
            {t("origin")}
            <select
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setRouteId("");
              }}
            >
              <option value="">{t("chooseOrigin")}</option>
              {origins.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <div className="route-dots">
            <MapPin size={18} />
            <span />
            <ArrowDown size={16} />
          </div>
          <label>
            {t("destination")}
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              disabled={!from}
            >
              <option value="">{t("chooseDestination")}</option>
              {destinations.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.to} · {r.route}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <Fuel size={15} />
              {t("fuelBand")}
            </span>
            <select value={band} onChange={(e) => setBand(e.target.value)}>
              <option value="">{t("chooseFuel")}</option>
              {data.fuelBands.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("discount")}
            <select
              value={passenger}
              onChange={(e) => setPassenger(e.target.value)}
            >
              {["regular", "student", "senior", "PWD"].map((d) => (
                <option key={d} value={d}>
                  {t(d)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="small muted">{t("fuelNote")}</p>
        <div className="tariff-source">
          <Info size={16} />
          <p>{t("tariffSource")}</p>
        </div>
      </section>
      <div>
        <section className="fare-result tariff-result">
          <span className="eyebrow">{t("listedFare")}</span>
          <div className="fare-amount">
            {amount === null ? "—" : `₱${amount}`}
          </div>
          <p>
            {selected
              ? `${selected.from} → ${selected.to}`
              : t("chooseRouteFuel")}
          </p>
          {selected && (
            <span
              className="plate-badge"
              style={
                {
                  "--plate": (
                    {
                      White: "#fafafa",
                      Gold: "#dca800",
                      Gray: "#999",
                      Black: "#292929",
                      Yellow: "#f9d445",
                      Blue: "#397fce",
                      Silver: "#bfc2c6",
                      Pink: "#d799df",
                      Brown: "#ac8265",
                    } as Record<string, string>
                  )[selected.plateColor],
                } as React.CSSProperties
              }
            >
              <i />
              {selected.plateColor} · {selected.route}
            </span>
          )}
          {routeId && band && amount === null && (
            <p className="fare-warning">{t("missingTariff")}</p>
          )}
          {selected?.notes && <p className="fare-warning">{selected.notes}</p>}
          <small>{t("tariffDisclaimer")}</small>
        </section>
        {selected && (
          <section className="info-panel tariff-table-panel">
            <h3>{t("allBands")}</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("fuelBand")}</th>
                    <th>{t("regular")}</th>
                    <th>{t("discounted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fuelBands.map((b, i) => (
                    <tr key={b.id} className={b.id === band ? "active" : ""}>
                      <td>{b.label}</td>
                      <td>
                        {selected.fares[i]
                          ? `₱${selected.fares[i]!.regular}`
                          : "—"}
                      </td>
                      <td>
                        {selected.fares[i]
                          ? `₱${selected.fares[i]!.discounted}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">{t("tariffEndpoints")}</p>
          </section>
        )}
        <a className="text-button" href="/data/tricycle-tariffs.json" download>
          {t("downloadTariffs")}
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}
function TripEstimate() {
  const { restaurants, landmarks, fares, origin, locate } = useApp(),
    [params] = useSearchParams(),
    { t, i18n } = useTranslation();
  const [from, setFrom] = useState("plaza"),
    [to, setTo] = useState(
      params.get("to") ??
        restaurants.find((r) => r.lat !== null && r.lng !== null)!.id,
    ),
    [mode, setMode] = useState("tricycle"),
    [discount, setDiscount] = useState("regular"),
    [route, setRoute] = useState<RouteResult>(),
    [loading, setLoading] = useState(false);
  const mappedRestaurants = restaurants.filter(
    (r): r is Restaurant & Coordinates => r.lat !== null && r.lng !== null,
  );
  const destination =
      mappedRestaurants.find((r) => r.id === to) ?? mappedRestaurants[0],
    point =
      from === "gps"
        ? (origin ?? cityCenter)
        : (landmarks.find((l) => l.id === from) ?? cityCenter),
    km = route?.km ?? offlineRoute(point, destination).km,
    estimate = estimateFare(fares, mode, km, discount);
  const mapRestaurants = useMemo(
    () => restaurants.filter((r) => r.id === to),
    [restaurants, to],
  );
  useEffect(() => {
    setRoute(offlineRoute(point, destination));
  }, [point, destination]);
  async function getRoute() {
    setLoading(true);
    setRoute(await osrmProvider.route(point, destination));
    setLoading(false);
  }
  if (
    params.has("to") &&
    !mappedRestaurants.some((r) => r.id === params.get("to"))
  ) {
    return (
      <div className="info-panel" role="status">
        <h2>{t("mapUnconfirmed")}</h2>
        <p>{t("sourceDetail")}</p>
        <a className="secondary" href="/fare?trip=1">
          {t("destination")}
        </a>
      </div>
    );
  }
  return (
    <>
      <div className="sample-detail">
        <Info size={17} />
        {t("tripSampleNote")}
      </div>
      <div className="fare-layout">
        <section className="form-panel">
          <label>
            {t("origin")}
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {landmarks.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              {origin && <option value="gps">{t("yourLocation")}</option>}
            </select>
          </label>
          <button
            className="text-button"
            onClick={async () => {
              await locate();
              setFrom("gps");
            }}
          >
            <LocateFixed size={15} />
            {t("yourLocation")}
          </button>
          <div className="route-dots">
            <MapPin size={18} />
            <span />
            <ArrowDown size={16} />
          </div>
          <label>
            {t("destination")}
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {mappedRestaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t("transport")}</legend>
            <div className="transport-options">
              {fares.modes.map((m) => (
                <button
                  type="button"
                  aria-pressed={mode === m.id}
                  className={mode === m.id ? "active" : ""}
                  key={m.id}
                  onClick={() => setMode(m.id)}
                >
                  <span>
                    {
                      (
                        {
                          tricycle: "🛺",
                          jeepney: "🚐",
                          "habal-habal": "🏍️",
                          bus: "🚌",
                        } as Record<string, string>
                      )[m.id]
                    }
                  </span>
                  {t(m.id)}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            {t("discount")}
            <select
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            >
              {["regular", "student", "senior", "PWD"].map((d) => (
                <option key={d} value={d}>
                  {t(d)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary wide"
            disabled={loading}
            onClick={getRoute}
          >
            <Navigation size={17} />
            {t(loading ? "routeLoading" : "directions")}
          </button>
          <div className="fare-result">
            <span className="eyebrow">{t("estimate")}</span>
            <div className="fare-amount">
              ₱{estimate.low}
              <span>–</span>₱{estimate.high}
            </div>
            <p>
              {t("routeEstimate", {
                km: km.toFixed(1),
                minutes:
                  route?.minutes ?? offlineRoute(point, destination).minutes,
              })}
            </p>
            <small>{t("fareDisclaimer")}</small>
          </div>
        </section>
        <div className="fare-map">
          <Suspense fallback={<div className="skeleton map-skeleton" />}>
            <MapView
              restaurants={mapRestaurants}
              origin={point}
              route={route}
            />
          </Suspense>
          <div className="route-note">
            <Info size={17} />
            <p>
              {t(route?.estimated !== false ? "straightLine" : "roadRoute")}
            </p>
          </div>
          <section className="info-panel">
            <h3>{t("landmarkDirections")}</h3>
            <p>
              {destination.directions[i18n.language as "en" | "hil" | "fil"] ??
                destination.directions.en}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
