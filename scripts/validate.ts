import { readFileSync } from "node:fs";
import { restaurantSchema, fareSchema } from "../src/lib/schema";
const source = process.argv[2];
const data = restaurantSchema
  .array()
  .parse(
    source
      ? JSON.parse(readFileSync(source, "utf8"))
      : ["restaurants", "tourist-spots"].flatMap((name) =>
          JSON.parse(readFileSync(`public/data/${name}.json`, "utf8")),
        ),
  );
for (const key of ["id", "slug"] as const)
  if (new Set(data.map((r) => r[key])).size !== data.length)
    throw new Error(`Duplicate ${key}`);
fareSchema.parse(JSON.parse(readFileSync("public/data/fares.json", "utf8")));
for (const place of data) {
  if (!place.sample && !place.sources.length)
    throw new Error(`Missing sources: ${place.id}`);
  if ((place.lat === null) !== (place.lng === null))
    throw new Error(`Incomplete coordinates: ${place.id}`);
}
console.log(
  `Validated ${data.length} sourced places (${data.filter((r) => r.kind === "attraction").length} tourist spots) and fare configuration.`,
);
