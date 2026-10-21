import Fuse from "fuse.js";
import type { Coordinates, Filters, Restaurant } from "./schema";
export const cityCenter: Coordinates = { lat: 9.9902, lng: 122.8148 };
export function hasCoordinates<
  T extends { lat: number | null; lng: number | null },
>(r: T): r is T & Coordinates {
  return r.lat !== null && r.lng !== null;
}
export function distanceKm(
  a: { lat: number | null; lng: number | null },
  b: Coordinates,
) {
  if (!hasCoordinates(a)) return Infinity;
  const rad = Math.PI / 180,
    dlat = (b.lat - a.lat) * rad,
    dlng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export function isOpen(r: Restaurant, date = new Date()) {
  if (!r.hours.length) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    now = Number(get("hour")) * 60 + Number(get("minute"));
  const today = r.hours[day] ?? [],
    yesterday = r.hours[(day + 6) % 7] ?? [];
  return (
    today.some(([s, e]) => {
      const start = minutes(s),
        end = minutes(e);
      return (
        start === end ||
        (end > start ? now >= start && now < end : now >= start)
      );
    }) ||
    yesterday.some(([s, e]) => minutes(e) < minutes(s) && now < minutes(e))
  );
}
export function searchRestaurants(
  restaurants: Restaurant[],
  filters: Filters,
  origin: Coordinates = cityCenter,
  date = new Date(),
) {
  let found = filters.query.trim()
    ? new Fuse(restaurants, {
        keys: [
          { name: "name", weight: 2 },
          "categories",
          "cuisine",
          "signatureDishes",
          "barangay",
          "landmark",
          "tags",
        ],
        threshold: 0.36,
        ignoreLocation: true,
      })
        .search(filters.query.trim())
        .map((m) => m.item)
    : [...restaurants];
  found = found.filter(
    (r) =>
      (filters.category === "all" || r.categories.includes(filters.category)) &&
      (!filters.open || isOpen(r, date)) &&
      (!filters.budget || r.priceLevel === filters.budget) &&
      (!filters.tag || r.tags.includes(filters.tag)) &&
      (!filters.service || r.services.includes(filters.service)) &&
      (!filters.payment || r.payments.includes(filters.payment)) &&
      r.rating >= filters.rating,
  );
  return found.sort((a, b) =>
    filters.sort === "distance"
      ? distanceKm(a, origin) - distanceKm(b, origin)
      : filters.sort === "rating"
        ? b.rating - a.rating
        : filters.sort === "price"
          ? (a.priceLevel || Infinity) - (b.priceLevel || Infinity)
          : filters.sort === "new"
            ? b.createdAt.localeCompare(a.createdAt)
            : b.popularity - a.popularity || a.name.localeCompare(b.name),
  );
}
