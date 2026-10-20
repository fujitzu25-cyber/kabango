import type { Coordinates } from "./schema";
import { distanceKm } from "./search";
export type RouteResult = {
  points: [number, number][];
  km: number;
  minutes: number;
  estimated: boolean;
};
export interface RoutingProvider {
  route(
    from: Coordinates,
    to: Coordinates,
    signal?: AbortSignal,
  ): Promise<RouteResult>;
}
export const offlineRoute = (
  from: Coordinates,
  to: Coordinates,
): RouteResult => ({
  points: [
    [from.lat, from.lng],
    [to.lat, to.lng],
  ],
  km: distanceKm(from, to),
  minutes: Math.ceil((distanceKm(from, to) / 20) * 60),
  estimated: true,
});
export const osrmProvider: RoutingProvider = {
  async route(from, to, signal) {
    if (!navigator.onLine) return offlineRoute(from, to);
    try {
      const result = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
        { signal: signal ?? AbortSignal.timeout(6000) },
      );
      if (!result.ok) throw new Error("Routing unavailable");
      const data = await result.json();
      const route = data.routes?.[0];
      if (!route) throw new Error("No route");
      return {
        points: route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng],
        ),
        km: route.distance / 1000,
        minutes: Math.max(1, Math.round(route.duration / 60)),
        estimated: false,
      };
    } catch {
      return offlineRoute(from, to);
    }
  },
};
