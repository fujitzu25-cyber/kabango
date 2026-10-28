import { readFile, readdir, mkdir, lstat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isIP } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";

// Conservative central discovery rectangle from the existing OSM research query.
// This is NOT the city's administrative boundary or proof of a business location.
const CENTRAL_REVIEW_AREA = {
  south: 9.96,
  north: 10.03,
  west: 122.78,
  east: 122.85,
};
const MAX_ROWS = 10000;
const MAX_BYTES = 10 * 1024 * 1024;

function text(value, label, maximum, required = true) {
  if (value === undefined || value === null || value === "") {
    if (!required) return undefined;
    throw new Error(`${label} is required`);
  }
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} must be bounded plain text`);
  }
  const clean = value.trim();
  if (!clean && required) throw new Error(`${label} is required`);
  return clean || undefined;
}

function publicUrl(value, label, required = true) {
  const source = text(value, label, 4096, required);
  if (!source) return undefined;
  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !/^https?:$/.test(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    isIP(host.replace(/^\[|\]$/g, "")) ||
    !host.includes(".") ||
    /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host)
  ) {
    throw new Error(
      `${label} must be a public HTTP(S) URL without credentials or a custom port`,
    );
  }
  return { source, parsed };
}

function mapsUrl(value) {
  const result = publicUrl(value, "maps_url");
  const { hostname, pathname } = result.parsed;
  const isGoogleMaps =
    ((hostname === "google.com" || hostname.endsWith(".google.com")) &&
      (pathname === "/maps" ||
        pathname.startsWith("/maps/") ||
        hostname === "maps.google.com")) ||
    (hostname === "maps.app.goo.gl" && /^\/[A-Za-z0-9_-]+$/.test(pathname)) ||
    (hostname === "goo.gl" && pathname.startsWith("/maps/"));
  if (!isGoogleMaps)
    throw new Error("maps_url must identify a Google Maps page");
  return result.source; // Preserve the exact source URL; never fetch or rewrite it.
}

function identity(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function nameAddress(name, address) {
  return `${identity(name)}\n${identity(address)}`;
}

function collectionDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      "--collected-at requires the actual collection date as YYYY-MM-DD",
    );
  }
  return value;
}

function coordinates(row, warnings) {
  const latMissing =
    row.latitude === undefined || row.latitude === null || row.latitude === "";
  const lngMissing =
    row.longitude === undefined ||
    row.longitude === null ||
    row.longitude === "";
  if (latMissing && lngMissing) {
    warnings.push(
      "No coordinates supplied; confirm the location independently.",
    );
    return { lat: null, lng: null };
  }
  if (
    typeof row.latitude !== "number" ||
    typeof row.longitude !== "number" ||
    !Number.isFinite(row.latitude) ||
    !Number.isFinite(row.longitude) ||
    Math.abs(row.latitude) > 90 ||
    Math.abs(row.longitude) > 180
  ) {
    throw new Error(
      "coordinates must be a valid numeric latitude/longitude pair",
    );
  }
  const { south, north, west, east } = CENTRAL_REVIEW_AREA;
  if (
    row.latitude < south ||
    row.latitude > north ||
    row.longitude < west ||
    row.longitude > east
  ) {
    warnings.push(
      "Supplied coordinates are outside the conservative central review area; discarded pending location review. This area is not the municipal boundary.",
    );
    return { lat: null, lng: null };
  }
  warnings.push(
    "Coordinates fall within the central review area; city boundary and entrance remain unverified.",
  );
  return { lat: row.latitude, lng: row.longitude };
}

/** Convert the upstream JSON array into private review candidates, never app data. */
export function stageGeoLeads(rows, { collectedAt, existing = [] } = {}) {
  collectionDate(collectedAt);
  if (!Array.isArray(rows) || rows.length > MAX_ROWS)
    throw new Error(
      "Input must be a GeoLeadScraper JSON array of at most 10000 rows",
    );
  const candidates = [],
    rejected = [],
    duplicates = [];
  const seenUrls = new Map(),
    seenNames = new Map();
  for (let index = 0; index < rows.length; index++) {
    const rowNumber = index + 1;
    try {
      const row = rows[index];
      if (!row || typeof row !== "object" || Array.isArray(row))
        throw new Error("row must be a business object");
      const name = text(row.title, "title", 250);
      const address = text(row.address, "address", 1000);
      if (!/\bkabankalan\b/i.test(address))
        throw new Error(
          "address must explicitly identify Kabankalan; review the city independently",
        );
      const sourceUrl = mapsUrl(row.maps_url);
      const website = publicUrl(row.website, "website", false)?.source;
      const category = text(row.categories, "categories", 1000, false);
      const key = nameAddress(name, address);
      const duplicateOf = seenUrls.get(sourceUrl) ?? seenNames.get(key);
      if (duplicateOf !== undefined) {
        duplicates.push({ rowNumber, duplicateOfRow: duplicateOf });
        continue;
      }
      const warnings = [];
      const position = coordinates(row, warnings);
      const byUrl = existing.filter(
        (place) => place.googleMapsUrl === sourceUrl,
      );
      const matches = byUrl.length
        ? byUrl
        : existing.filter(
            (place) =>
              typeof place.name === "string" &&
              typeof place.address === "string" &&
              nameAddress(place.name, place.address) === key,
          );
      const existingIds = [
        ...new Set(
          matches
            .map((place) => place.id)
            .filter((id) => typeof id === "string"),
        ),
      ];
      const candidate = {
        rowNumber,
        status: "needs-review",
        name,
        address,
        ...(category ? { category } : {}),
        ...(website ? { website } : {}),
        sourceUrl,
        collectedAt,
        ...position,
        locationReviewRequired: true,
        match: {
          method: byUrl.length
            ? "exact-source-url"
            : existingIds.length
              ? "normalized-name-and-address"
              : "none",
          existingIds,
        },
        warnings,
      };
      candidates.push(candidate);
      seenUrls.set(sourceUrl, rowNumber);
      seenNames.set(key, rowNumber);
    } catch (error) {
      rejected.push({ rowNumber, reason: error.message });
    }
  }
  return {
    format: "kabgo-geoleads-review-v1",
    collectedAt,
    notice:
      "Private discovery candidates only. Collection does not verify current operation, contact details, hours, ratings, photo rights, or city boundaries. Nothing is published automatically.",
    candidates,
    duplicates,
    rejected,
  };
}

export async function assertStagingPath(root, output) {
  const localRoot = path.resolve(root, ".local");
  const destination = path.resolve(root, output);
  const relative = path.relative(localRoot, destination);
  if (
    !relative ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    path.extname(destination) !== ".json"
  ) {
    throw new Error(
      "Output must be a new .json file inside this repository's ignored .local/ directory",
    );
  }
  const segments = [localRoot];
  let current = localRoot;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    segments.push(current);
  }
  for (const segment of segments) {
    try {
      if ((await lstat(segment)).isSymbolicLink())
        throw new Error(
          "Output path cannot contain symbolic links or junctions",
        );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return destination;
}

async function existingPlaces(root) {
  const directory = path.join(root, "public", "data");
  const records = [];
  for (const filename of await readdir(directory)) {
    if (!filename.endsWith(".json")) continue;
    const value = JSON.parse(
      await readFile(path.join(directory, filename), "utf8"),
    );
    if (Array.isArray(value))
      records.push(
        ...value.filter(
          (row) =>
            row &&
            typeof row.id === "string" &&
            typeof row.googleMapsUrl === "string",
        ),
      );
  }
  return records;
}

export async function importGeoLeads({ root, input, output, collectedAt }) {
  collectionDate(collectedAt);
  const destination = await assertStagingPath(root, output);
  const content = await readFile(path.resolve(root, input));
  if (content.length > MAX_BYTES)
    throw new Error("Input exceeds the 10 MiB limit");
  const review = stageGeoLeads(JSON.parse(content.toString("utf8")), {
    collectedAt,
    existing: await existingPlaces(root),
  });
  await mkdir(path.dirname(destination), { recursive: true });
  await assertStagingPath(root, output);
  await writeFile(destination, `${JSON.stringify(review, null, 2)}\n`, {
    flag: "wx",
  });
  return {
    output: destination,
    candidates: review.candidates.length,
    duplicates: review.duplicates.length,
    rejected: review.rejected.length,
  };
}

async function main(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (
      !["--input", "--output", "--collected-at"].includes(key) ||
      options[key] ||
      !args[index + 1]
    ) {
      throw new Error(
        "Usage: node scripts/import-geoleads.mjs --input export.json --output .local/research/geoleads-review.json --collected-at YYYY-MM-DD",
      );
    }
    options[key] = args[index + 1];
  }
  if (!options["--input"] || !options["--output"])
    throw new Error("Both --input and --output are required");
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  console.log(
    JSON.stringify(
      await importGeoLeads({
        root,
        input: options["--input"],
        output: options["--output"],
        collectedAt: options["--collected-at"],
      }),
    ),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
