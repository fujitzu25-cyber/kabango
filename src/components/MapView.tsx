import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Restaurant, Coordinates } from "../lib/schema";
import type { RouteResult } from "../lib/routing";
import { cityCenter, hasCoordinates } from "../lib/search";
import { useTranslation } from "react-i18next";
type Props = {
  restaurants: Restaurant[];
  origin?: Coordinates;
  route?: RouteResult;
  onSelect?: (r: Restaurant) => void;
  compact?: boolean;
};
export default function MapView({
  restaurants,
  origin,
  route,
  onSelect,
  compact,
}: Props) {
  const div = useRef<HTMLDivElement>(null),
    [error, setError] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    if (!div.current) return;
    const map = L.map(div.current, {
      scrollWheelZoom: false,
      zoomControl: !compact,
    }).setView([cityCenter.lat, cityCenter.lng], 14);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        minZoom: 12,
        maxZoom: 17,
      },
    );
    tiles.on("tileerror", () => setError(true));
    tiles.addTo(map);
    const markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
    });
    const mapped = restaurants.filter(hasCoordinates);
    for (const r of mapped) {
      const icon = L.divIcon({
        className: "food-marker",
        html: "<span>🍴</span>",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      const marker = L.marker([r.lat, r.lng], { icon, alt: r.name });
      const box = document.createElement("div"),
        title = document.createElement("strong");
      title.textContent = r.name;
      box.append(title);
      if (onSelect) {
        const button = document.createElement("button");
        button.className = "map-popup-button";
        button.textContent = t("viewDetails");
        button.onclick = () => onSelect(r);
        box.append(button);
      }
      marker.bindPopup(box);
      markers.addLayer(marker);
    }
    map.addLayer(markers);
    if (origin)
      L.circleMarker([origin.lat, origin.lng], {
        color: "#2563eb",
        fillOpacity: 0.9,
        radius: 7,
      })
        .bindTooltip(t("yourLocation"))
        .addTo(map);
    if (route) {
      L.polyline(route.points, {
        color: "#ec6339",
        weight: 5,
        dashArray: route.estimated ? "8 8" : undefined,
      }).addTo(map);
      map.fitBounds(L.latLngBounds(route.points).pad(0.25));
    } else if (mapped.length === 1)
      map.setView([mapped[0].lat, mapped[0].lng], 15);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(div.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [restaurants, origin, route, onSelect, compact, t]);
  return (
    <div className={`map-wrap ${compact ? "compact" : ""}`}>
      <div ref={div} className="leaflet-map" aria-label={t("foodMap")} />
      {error && <div className="map-notice">{t("mapOffline")}</div>}
    </div>
  );
}
