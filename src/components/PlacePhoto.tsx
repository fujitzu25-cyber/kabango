import { useState } from "react";
import { Camera, Coffee, UtensilsCrossed } from "lucide-react";
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
  const [failed, setFailed] = useState(false);
  const src = r.photos[index];
  if (!src || failed)
    return (
      <div
        className={`place-placeholder ${r.categories.includes("Café") ? "cafe-placeholder" : ""}`}
      >
        {r.categories.includes("Café") ? (
          <Coffee size={44} strokeWidth={1.2} />
        ) : (
          <UtensilsCrossed size={44} strokeWidth={1.2} />
        )}
        <strong>{r.name}</strong>
        <span>
          <Camera size={13} /> Photo not available
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
