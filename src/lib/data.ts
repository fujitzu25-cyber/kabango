import { z } from "zod";
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
    restaurantSchema
      .array()
      .parse(
        (await Promise.all([get("restaurants"), get("tourist-spots")])).flat(),
      ),
  fares: async () => fareSchema.parse(await get("fares")),
  landmarks: async () => landmarkSchema.array().parse(await get("landmarks")),
  categories: async () =>
    z
      .string()
      .max(100)
      .array()
      .max(100)
      .parse(await get("categories")),
};

const landmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const guideSchema = z.object({
  restaurants: restaurantSchema.array().max(5000),
  fares: fareSchema,
  categories: z.string().array().max(100),
  landmarks: landmarkSchema.array().max(1000),
});
