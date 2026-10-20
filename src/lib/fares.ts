import type { FareConfig } from "./schema";
export function estimateFare(
  config: FareConfig,
  modeId: string,
  km: number,
  discount = "regular",
  from = "",
  to = "",
) {
  if (!Number.isFinite(km) || km < 0)
    throw new Error("Distance must be non-negative");
  const mode = config.modes.find((m) => m.id === modeId);
  if (!mode) throw new Error("Unknown transport");
  const zone = mode.zoneFares.find(
    (z) => (z.from === from && z.to === to) || (z.from === to && z.to === from),
  );
  const base =
    zone?.fare ??
    Math.max(
      mode.minFare,
      mode.baseFare + Math.max(0, km - mode.includedKm) * mode.perKm,
    );
  const amount = base * (1 - (mode.discounts[discount] ?? 0));
  return {
    low: Math.ceil(amount),
    high: Math.ceil(amount * (1 + mode.uncertainty)),
    notes: mode.notes,
  };
}
