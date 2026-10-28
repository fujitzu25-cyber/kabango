import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  BedDouble,
  Camera,
  Coffee,
  Fuel,
  Mountain,
  UtensilsCrossed,
} from "lucide-react";
import type { Restaurant } from "../lib/schema";
export default function PlacePhoto({
  restaurant: r,
  index = 0,
  priority = false,
}: {
  restaurant: Restaurant;
  index?: number;
  priority?: boolean;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const src = r.photos[index];
  if (!src || failed)
    return (
      <div
        className={`place-placeholder ${r.categories.includes("Café") ? "cafe-placeholder" : ""}`}
      >
        {r.kind === "hotel" ? (
          <BedDouble size={44} strokeWidth={1.2} />
        ) : r.kind === "fuel" ? (
          <Fuel size={44} strokeWidth={1.2} />
        ) : r.kind === "attraction" ? (
          <Mountain size={44} strokeWidth={1.2} />
        ) : r.categories.includes("Café") ? (
          <Coffee size={44} strokeWidth={1.2} />
        ) : (
          <UtensilsCrossed size={44} strokeWidth={1.2} />
        )}
        <strong>{r.name}</strong>
        <span>
          <Camera size={13} /> {t("photoUnavailable")}
        </span>
      </div>
    );
  return (
    <img
      src={src}
      alt={`${r.name} — ${r.photoCredit ?? "listing photo"}`}
      width="600"
      height="420"
      loading={priority ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
