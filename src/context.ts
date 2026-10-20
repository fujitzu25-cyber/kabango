import { useOutletContext } from "react-router-dom";
import type { Restaurant, FareConfig, Coordinates } from "./lib/schema";
import type { Landmark } from "./lib/data";
import type { Saved } from "./lib/db";
export type AppContext = {
  restaurants: Restaurant[];
  fares: FareConfig;
  categories: string[];
  landmarks: Landmark[];
  saved: Saved[];
  toggleSave: (id: string, list?: "favorites" | "want") => void;
  origin?: Coordinates;
  locate: () => Promise<void>;
  toast: (text: string) => void;
};
export const useApp = () => useOutletContext<AppContext>();
