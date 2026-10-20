import { readFileSync } from "node:fs";
import { restaurantSchema, fareSchema } from "../src/lib/schema";
const source = process.argv[2] ?? "public/data/restaurants.json";
const data = restaurantSchema
  .array()
  .parse(JSON.parse(readFileSync(source, "utf8")));
for (const key of ["id", "slug"] as const)
  if (new Set(data.map((r) => r[key])).size !== data.length)
    throw new Error(`Duplicate ${key}`);
fareSchema.parse(JSON.parse(readFileSync("public/data/fares.json", "utf8")));
console.log(
  `Validated ${data.length} restaurants and fare configuration. Import by replacing public/data/restaurants.json after validation.`,
);
