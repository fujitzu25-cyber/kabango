import { restaurantSchema, fareSchema } from "./schema";
import type { Restaurant, FareConfig, Coordinates } from "./schema";
export interface DataProvider {
  restaurants(): Promise<Restaurant[]>;
  fares(): Promise<FareConfig>;
  landmarks(): Promise<Landmark[]>;
  categories(): Promise<string[]>;
}
export type Landmark = Coordinates & { id: string; name: string };
async function get(file: string) {
  const response = await fetch(`/data/${file}.json`);
  if (!response.ok)
    throw new Error("Could not load local guide. Please retry.");
  return response.json();
}
export const localData: DataProvider = {
  restaurants: async () =>
    restaurantSchema.array().parse(await get("restaurants")),
  fares: async () => fareSchema.parse(await get("fares")),
  landmarks: () => get("landmarks"),
  categories: () => get("categories"),
};
