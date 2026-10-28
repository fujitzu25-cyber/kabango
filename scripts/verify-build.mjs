import fs from "node:fs";
import assert from "node:assert/strict";
const places = [
  ...JSON.parse(fs.readFileSync("public/data/restaurants.json")),
  ...JSON.parse(fs.readFileSync("public/data/tourist-spots.json")),
  ...JSON.parse(fs.readFileSync("public/data/services.json")),
];
for (const path of [
  "index.html",
  ...places.map((r) => `place/${r.slug}/index.html`),
]) {
  const html = fs.readFileSync(`dist/${path}`, "utf8");
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const decode = (s) =>
    s
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">");
  assert(title && decode(title).length <= 60, `Missing/long title: ${path}`);
  assert.equal(
    (html.match(/rel="canonical"/g) ?? []).length,
    1,
    `Duplicate canonical: ${path}`,
  );
  assert.match(
    html,
    /property="og:image"\s+content="https:\/\/[^" ]+\/og-cover.png"/,
  );
  assert.match(
    html,
    /name="twitter:image"\s+content="https:\/\/[^" ]+\/og-cover.png"/,
  );
  const description = html.match(/name="description"\s+content="([^"]*)"/)?.[1];
  assert(
    description && decode(description).length <= 155,
    `Missing/long description: ${path}`,
  );
  if (path.includes("mag-aso-falls"))
    assert.match(html, /"@type":"TouristAttraction"/);
  if (path.includes("organiko-")) assert.match(html, /"@type":"Restaurant"/);
  const place = places.find((r) => path === `place/${r.slug}/index.html`);
  if (place) {
    const structured = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ),
    ]
      .map((match) => JSON.parse(match[1]))
      .find((data) => data.name === place.name);
    assert(structured, `Missing place structured data: ${path}`);
    const kind = place.kind ?? "food";
    const expectedTypes = [kind, ...(place.secondaryKinds ?? [])].map(
      (value) =>
        ({
          food: "Restaurant",
          attraction: "TouristAttraction",
          hotel: "Hotel",
          fuel: "GasStation",
        })[value],
    );
    assert.deepEqual(
      Array.isArray(structured["@type"])
        ? structured["@type"]
        : [structured["@type"]],
      expectedTypes,
      `Incorrect place schema: ${path}`,
    );
    if (kind === "food")
      assert.deepEqual(
        structured.servesCuisine,
        place.cuisine,
        `Missing food cuisine: ${path}`,
      );
    else
      assert(
        !("servesCuisine" in structured),
        `Cuisine on a non-food place: ${path}`,
      );
  }
  if (place?.kind === "hotel") assert.match(html, /"@type":"Hotel"/);
  if (place?.kind === "fuel") assert.match(html, /"@type":"GasStation"/);
  assert.doesNotMatch(html, /"aggregateRating"/);
}
const manifest = JSON.parse(fs.readFileSync("dist/manifest.webmanifest"));
assert.equal(manifest.short_name, "KabGo");
assert(fs.existsSync("dist/images/magaso-540.webp"));
console.log(
  `Verified metadata, canonical URLs, image assets, structured data and manifest for ${places.length + 1} pages.`,
);
