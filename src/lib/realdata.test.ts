import { describe, it, expect } from "vitest";
import data from "../../public/data/restaurants.json";
import { defaultFilters, restaurantSchema } from "./schema";
import {
  hasCoordinates,
  isOpen,
  searchRestaurants,
  cityCenter,
  distanceKm,
} from "./search";
const places = restaurantSchema.array().parse(data);
describe("sourced production directory", () => {
  it("contains real sourced businesses and no fabricated ratings or stock restaurant photos", () => {
    expect(places.length).toBeGreaterThan(60);
    expect(
      places.every(
        (r) =>
          !r.sample &&
          r.sources.length &&
          r.rating === 0 &&
          r.reviewCount === 0,
      ),
    ).toBe(true);
    expect(places.filter((r) => r.photos.length).length).toBe(30);
    expect(
      places.every((r) => r.photos.every((p) => p.startsWith("https://"))),
    ).toBe(true);
    expect(new Set(places.map((r) => r.slug)).size).toBe(places.length);
  });
  it("keeps unpublished hours and positions unknown", () => {
    const r = places.find((r) => !hasCoordinates(r))!;
    expect(isOpen({ ...r, hours: [] })).toBeNull();
    expect(distanceKm(r, cityCenter)).toBe(Infinity);
    const knownOpen = searchRestaurants(places, {
      ...defaultFilters,
      open: true,
    });
    expect(knownOpen.every((r) => r.hours.length === 7)).toBe(true);
    expect(searchRestaurants(places, { ...defaultFilters, budget: 1 })).toEqual(
      [],
    );
  });
  it("uses the official Jollibee branch hours with a precise closing boundary", () => {
    const r = places.find((r) => r.slug === "jollibee-kabankalan-gaisano")!;
    expect(isOpen(r, new Date("2026-10-21T10:59:00Z"))).toBe(true);
    expect(isOpen(r, new Date("2026-10-21T11:00:00Z"))).toBe(false);
  });
});
