import { createContext, useContext } from "react";
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
const GuideContext = createContext<AppContext | null>(null);
export const AppProvider = GuideContext.Provider;
export function useApp() {
  const value = useContext(GuideContext);
  if (!value) throw new Error("Guide context is not ready");
  return value;
}
