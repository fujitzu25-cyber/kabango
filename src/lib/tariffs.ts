import { z } from "zod";
export const tariffSchema = z.object({
  source: z.object({
    title: z.string(),
    receivedAt: z.string(),
    verification: z.string(),
    notes: z.string(),
  }),
  fuelBands: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        min: z.number(),
        max: z.number().nullable(),
      }),
    )
    .length(5),
  routes: z.array(
    z.object({
      id: z.string(),
      area: z.string(),
      from: z.string(),
      to: z.string(),
      route: z.string(),
      plateColor: z.string(),
      fares: z
        .array(
          z.object({ regular: z.number(), discounted: z.number() }).nullable(),
        )
        .length(5),
      notes: z.string(),
      sourceImage: z.string(),
    }),
  ),
});
export type TariffData = z.infer<typeof tariffSchema>;
export function lookupTariff(
  data: TariffData,
  routeId: string,
  bandId: string,
  discounted: boolean,
) {
  const route = data.routes.find((r) => r.id === routeId),
    index = data.fuelBands.findIndex((b) => b.id === bandId);
  if (!route || index < 0) return null;
  const fare = route.fares[index];
  return fare ? (discounted ? fare.discounted : fare.regular) : null;
}
