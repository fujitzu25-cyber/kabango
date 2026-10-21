import { describe, it, expect } from "vitest";
import source from "../../tests/fixtures/sample-restaurants.json";
import fareSource from "../../public/data/fares.json";
import tariffsSource from "../../public/data/tricycle-tariffs.json";
import { restaurantSchema, fareSchema, defaultFilters } from "./schema";
import { isOpen, searchRestaurants, distanceKm, cityCenter } from "./search";
import { estimateFare } from "./fares";
import { parseIntent, localAnswer, validateReply } from "./assistant";
import { tariffSchema, lookupTariff } from "./tariffs";
const restaurants = restaurantSchema.array().parse(source),
  fares = fareSchema.parse(fareSource),
  tariffs = tariffSchema.parse(tariffsSource);
describe("open hours in Asia/Manila", () => {
  it("handles a regular open interval and exact closing boundary", () => {
    expect(isOpen(restaurants[0], new Date("2026-10-20T04:00:00Z"))).toBe(true);
    expect(isOpen(restaurants[0], new Date("2026-10-20T13:00:00Z"))).toBe(
      false,
    );
  });
  it("handles previous-day overnight interval, including week wrap", () => {
    const r = {
      ...restaurants[0],
      hours: Array.from({ length: 7 }, () => [] as [string, string][]),
    };
    r.hours[6] = [["22:00", "02:00"]];
    expect(isOpen(r, new Date("2026-10-17T17:00:00Z"))).toBe(true);
    expect(isOpen(r, new Date("2026-10-17T19:00:00Z"))).toBe(false);
  });
  it("does not mark a closed day open", () => {
    const r = { ...restaurants[0], hours: Array.from({ length: 7 }, () => []) };
    expect(isOpen(r)).toBe(false);
  });
});
describe("search and distance", () => {
  it("finds dish typos offline", () =>
    expect(
      searchRestaurants(restaurants, {
        ...defaultFilters,
        query: "inasl",
      }).some((r) => r.id === "kg-1"),
    ).toBe(true));
  it("combines category, budget, service and payment filters", () => {
    const result = searchRestaurants(restaurants, {
      ...defaultFilters,
      category: "Filipino",
      budget: 1,
      service: "dine-in",
      payment: "cash",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (r) => r.priceLevel === 1 && r.categories.includes("Filipino"),
      ),
    ).toBe(true);
  });
  it("sorts nearest relative to chosen origin", () =>
    expect(
      searchRestaurants(
        restaurants,
        { ...defaultFilters, sort: "distance" },
        cityCenter,
      )[0].id,
    ).toBe("kg-1"));
  it("calculates a stable zero distance", () =>
    expect(distanceKm(cityCenter, cityCenter)).toBe(0));
});
describe("illustrative fare calculation", () => {
  it("applies minimum and included distance", () =>
    expect(estimateFare(fares, "tricycle", 0.5).low).toBe(15));
  it("applies distance and discount once", () =>
    expect(estimateFare(fares, "tricycle", 3, "student").low).toBe(24));
  it("respects explicit zone fares", () => {
    const copy = structuredClone(fares);
    copy.modes[0].zoneFares = [{ from: "A", to: "B", fare: 40 }];
    expect(estimateFare(copy, "tricycle", 10, "regular", "A", "B").low).toBe(
      40,
    );
  });
  it("rejects invalid distances and modes", () => {
    expect(() => estimateFare(fares, "tricycle", -1)).toThrow();
    expect(() => estimateFare(fares, "rocket", 1)).toThrow();
  });
});
describe("supplied tariff lookup", () => {
  it("keeps all 43 schedules and uses exact printed discounted amounts", () => {
    expect(tariffs.routes).toHaveLength(43);
    expect(lookupTariff(tariffs, "proper", "50to80", true)).toBe(14);
    expect(lookupTariff(tariffs, "hilamonan", "80to110", false)).toBe(28);
    expect(lookupTariff(tariffs, "hilamonan", "80to110", true)).toBe(22);
  });
  it("does not fill missing bands or guess the current fuel band", () => {
    expect(lookupTariff(tariffs, "sonedco", "110to130", false)).toBeNull();
    expect(lookupTariff(tariffs, "bagacay", "le50", false)).toBeNull();
    expect(lookupTariff(tariffs, "ubay", "gt130", true)).toBeNull();
    expect(lookupTariff(tariffs, "hilamonan", "", false)).toBeNull();
  });
  it("retains different Casipsipan schedules and source endpoint spellings", () => {
    expect(lookupTariff(tariffs, "casipsipan-a", "le50", false)).toBe(16);
    expect(lookupTariff(tariffs, "casipsipan-b", "le50", false)).toBe(21);
    expect(tariffs.routes.find((r) => r.id === "hilamonan")?.from).toBe("CCPA");
    expect(tariffs.routes.find((r) => r.id === "binicuil")?.from).toBe("CPPA");
  });
});
describe("local assistant and cloud validation", () => {
  it("understands Hiligaynon budget and cuisine", () => {
    const result = parseIntent("Diin may barato nga seafood?");
    expect(result.language).toBe("hil");
    expect(result.filters.budget).toBe(1);
    expect(result.filters.category).toBe("Seafood");
  });
  it("understands groups, late hours and Filipino", () => {
    expect(parseIntent("birthday for 15 people").groupSize).toBe(15);
    expect(parseIntent("Saan may pagkain bukas at 10pm").requestedHour).toBe(
      22,
    );
  });
  it("only recommends matching group capacity", () => {
    const result = localAnswer("Birthday for 30 people", restaurants);
    expect(
      result.restaurantIds.every(
        (id) => restaurants.find((r) => r.id === id)!.maxGroupSize >= 30,
      ),
    ).toBe(true);
  });
  it("discloses samples and returns known IDs", () => {
    const result = localAnswer("Best for family", restaurants);
    expect(result.reply).toMatch(/sample/i);
    expect(
      result.restaurantIds.every((id) => restaurants.some((r) => r.id === id)),
    ).toBe(true);
  });
  it("rejects hallucinated IDs and malformed JSON", () => {
    expect(() =>
      validateReply(
        { reply: "Try somewhere", restaurantIds: ["fake"] },
        restaurants,
      ),
    ).toThrow();
    expect(() => validateReply({ restaurantIds: [] }, restaurants)).toThrow();
  });
});
